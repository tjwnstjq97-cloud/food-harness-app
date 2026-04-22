/**
 * 음식점 검색 hook
 * Edge Function(search-restaurant) 경유로 네이버(KR) / 구글(GLOBAL) API 호출.
 * API Key는 Edge Function 서버에서만 사용 — 클라이언트 노출 금지.
 *
 * 하네스 규칙:
 * - 클라이언트에서 직접 네이버/구글 API 호출 금지
 * - region 없이 검색 금지
 * - Edge Function 실패 시 restaurants 캐시 테이블로 fallback
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRegion } from "../providers/RegionProvider";
import { isValidRegion } from "../types/region";
import type { Region } from "../types/region";
import type { Restaurant, SearchResult } from "../types/restaurant";

interface UseSearchOptions {
  query: string;
  enabled?: boolean;
  /** 최대 결과 수 (기본 30, 증가 시 더 보기 효과) */
  limit?: number;
}

/** ms → "0.3초" 형식 문자열 */
export function formatSearchDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}초`;
}

function toRestaurant(row: Record<string, unknown>, region: Region): Restaurant {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    region: isValidRegion(String(row.region)) ? (row.region as Region) : region,
    category: String(row.category ?? ""),
    address: String(row.address ?? ""),
    phone: row.phone ? String(row.phone) : undefined,
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
  };
}

/** Edge Function 응답 → Restaurant[] 변환 */
function toRestaurantFromEdge(item: Record<string, unknown>, region: Region): Restaurant {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    region: isValidRegion(String(item.region)) ? (item.region as Region) : region,
    category: String(item.category ?? ""),
    address: String(item.address ?? ""),
    phone: item.phone ? String(item.phone) : undefined,
    latitude: Number(item.latitude ?? 0),
    longitude: Number(item.longitude ?? 0),
    thumbnailUrl: item.thumbnailUrl ? String(item.thumbnailUrl) : undefined,
  };
}

/**
 * 검색어 기반 음식점 검색.
 * 1순위: Edge Function → 네이버(KR) / 구글(GLOBAL) 실시간 검색
 * 2순위: DB 캐시 fallback (Edge Function 실패 시)
 */
export function useSearch({ query, enabled = true, limit = 30 }: UseSearchOptions) {
  const { region } = useRegion();

  return useQuery({
    queryKey: ["search", region, query, limit],
    queryFn: async (): Promise<SearchResult> => {
      const trimmed = query.trim();
      if (!trimmed) {
        return { restaurants: [], totalCount: 0, hasMore: false, source: "" };
      }

      const startMs = Date.now();

      // ── 1순위: Edge Function 경유 (네이버/구글 실시간 검색) ──
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          "search-restaurant",
          {
            body: { query: trimmed, region, limit },
          }
        );

        if (!edgeError && edgeData && Array.isArray(edgeData.restaurants)) {
          const restaurants: Restaurant[] = edgeData.restaurants.map(
            (item: Record<string, unknown>) => toRestaurantFromEdge(item, region)
          );
          const durationMs = Date.now() - startMs;
          return {
            restaurants,
            totalCount: edgeData.totalCount ?? restaurants.length,
            hasMore: edgeData.hasMore ?? restaurants.length >= limit,
            source: edgeData.source ?? (region === "KR" ? "naver" : "google"),
            durationMs,
          };
        }

        // Edge Function 오류 로그 (개인정보 제외)
        if (edgeError) {
          console.info("[useSearch] Edge Function 오류, DB fallback 실행:", edgeError.message);
        }
      } catch (e) {
        console.info("[useSearch] Edge Function 예외, DB fallback 실행:", e instanceof Error ? e.message : "unknown");
      }

      // ── 2순위: DB 캐시 fallback ──
      const q = trimmed.replace(/[*%]/g, "");
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, region, category, address, phone, latitude, longitude, thumbnail_url")
        .eq("region", region)
        .or(`name.ilike.*${q}*,category.ilike.*${q}*,address.ilike.*${q}*`)
        .order("name", { ascending: true })
        .limit(limit);

      if (error) {
        const isTableOrAuthIssue =
          error.code === "42P01" ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist");
        if (isTableOrAuthIssue) {
          return {
            restaurants: [],
            totalCount: 0,
            hasMore: false,
            source: region === "KR" ? "naver" : "google",
          };
        }
        throw error;
      }

      const restaurants: Restaurant[] = (data ?? []).map((row) =>
        toRestaurant(row as Record<string, unknown>, region)
      );

      return {
        restaurants,
        totalCount: restaurants.length,
        hasMore: restaurants.length >= limit,
        source: region === "KR" ? "naver (캐시)" : "google (캐시)",
      };
    },
    enabled: enabled && !!query.trim(),
    staleTime: 1000 * 60 * 2, // 2분 캐시
    retry: 1,
  });
}
