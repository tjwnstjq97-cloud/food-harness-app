/**
 * 음식점 ID로 단건 조회 hook
 * 사용 시나리오:
 *  1. 즐겨찾기/히스토리에서 상세 페이지 진입 시 (부분 데이터만 있을 때)
 *  2. 검색 결과 없이 URL로 직접 접근 시
 *
 * selectedRestaurantStore에 이미 해당 ID의 전체 데이터가 있으면 DB 호출 스킵.
 * 하네스 규칙: region 없는 데이터 사용 금지.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { isValidRegion } from "../types/region";
import type { Region } from "../types/region";
import type { Restaurant } from "../types/restaurant";

function toRestaurant(row: Record<string, unknown>): Restaurant | null {
  const region = String(row.region ?? "");
  if (!isValidRegion(region)) return null;

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    region: region as Region,
    category: String(row.category ?? ""),
    address: String(row.address ?? ""),
    phone: row.phone ? String(row.phone) : undefined,
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
  };
}

export function useRestaurantById(id: string, skip = false) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: async (): Promise<Restaurant | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, region, category, address, phone, latitude, longitude, thumbnail_url")
        .eq("id", id)
        .maybeSingle();

      // 테이블 없거나 권한 오류 → null 반환 (graceful)
      if (error) {
        const isSafe =
          error.code === "42P01" ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist");
        if (isSafe) return null;
        throw error;
      }

      if (!data) return null;
      return toRestaurant(data as Record<string, unknown>);
    },
    enabled: !!id && !skip,
    staleTime: 1000 * 60 * 5, // 5분 캐시
    retry: 1,
  });
}
