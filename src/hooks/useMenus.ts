/**
 * 메뉴 hook
 * 하네스 규칙: source 없는 메뉴 정보 표시 금지. 추정 가격은 표기 필수.
 * DB 테이블 미존재 시 graceful fallback (앱 크래시 방지).
 *
 * TODO: Edge Function 경유로 전환 (네이버 Place API → 메뉴 추출)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getSignatureMenus } from "../types/menu";
import type { MenuItem, MenuResult } from "../types/menu";

const EMPTY_RESULT: MenuResult = {
  items: [],
  source: "",
  fetchedAt: "",
};

export function useMenus(restaurantId: string) {
  return useQuery({
    queryKey: ["menus", restaurantId],
    queryFn: async (): Promise<MenuResult> => {
      // TODO: Edge Function 경유로 변경
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("is_signature", { ascending: false })
        .order("mention_count", { ascending: false })
        .limit(10);

      // 테이블 미존재(42P01) → 빈 결과 반환 (앱 크래시 방지)
      if (error) {
        const isSafe =
          error.code === "42P01" ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist");
        if (isSafe) return EMPTY_RESULT;
        throw error;
      }

      const items: MenuItem[] = (data ?? [])
        .filter((row) => !!row.source) // 출처 없는 메뉴 필터링 (하네스 규칙)
        .map((row) => ({
          name: String(row.name ?? ""),
          price: Number(row.price ?? 0),
          priceStatus: (row.price_status as MenuItem["priceStatus"]) ?? "unknown",
          isSignature: Boolean(row.is_signature ?? false),
          source: String(row.source ?? ""),
          mentionCount: row.mention_count ? Number(row.mention_count) : undefined,
          imageUrl: row.image_url ? String(row.image_url) : undefined,
          description: row.description ? String(row.description) : undefined,
        }));

      return {
        items,
        source: data?.[0]?.source ?? "",
        fetchedAt: new Date().toISOString(),
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
    retry: 1,
  });
}

/** 대표 메뉴 상위 N개 (hook + 필터 조합 편의 함수) */
export function useSignatureMenus(restaurantId: string, limit = 3) {
  const query = useMenus(restaurantId);
  const signatures = query.data ? getSignatureMenus(query.data.items, limit) : [];
  return { ...query, signatures };
}
