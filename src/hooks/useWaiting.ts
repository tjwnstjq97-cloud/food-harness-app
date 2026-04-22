/**
 * 웨이팅 hook
 * 하네스 규칙: 근거 없으면 "추정" 표기 강제.
 * confidence 필드 기반: realtime / estimated / unknown
 * DB 테이블 미존재(42P01/PGRST301) 시 graceful fallback (앱 크래시 방지).
 *
 * DB 컬럼 매핑 (snake_case → camelCase):
 *   estimated_range_min/max → estimatedRange: { min, max }
 *   updated_at              → updatedAt
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { formatWaiting } from "../utils/validators";
import { UNKNOWN_WAITING } from "../types/waiting";
import type { Waiting } from "../types/restaurant";

interface WaitingDisplay {
  waiting: Waiting | null;
  displayText: string;
  /** true면 추정값 — UI에서 "(추정)" 태그 표시 필수 */
  isEstimated: boolean;
}

export function useWaiting(restaurantId: string) {
  return useQuery({
    queryKey: ["waiting", restaurantId],
    queryFn: async (): Promise<WaitingDisplay> => {
      // TODO: Edge Function 경유 (실시간 웨이팅 API)
      const { data, error } = await supabase
        .from("waiting")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      // 테이블 미존재(42P01/PGRST301) → graceful fallback
      if (error) {
        const isTableMissing =
          error.code === "42P01" ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist");
        if (isTableMissing) {
          return { waiting: null, displayText: "정보 없음", isEstimated: false };
        }
        throw error;
      }

      // 데이터 없음 fallback
      if (!data) {
        return { waiting: null, displayText: "정보 없음", isEstimated: false };
      }

      // DB 컬럼(snake_case) → Waiting 타입(camelCase) 매핑
      const waiting: Waiting = {
        minutes:        Number(data.minutes ?? 0),
        evidence:       String(data.evidence ?? ""),
        confidence:     (data.confidence as Waiting["confidence"]) ?? "unknown",
        updatedAt:      data.updated_at ? String(data.updated_at) : undefined,
        estimatedRange:
          data.estimated_range_min != null && data.estimated_range_max != null
            ? { min: Number(data.estimated_range_min), max: Number(data.estimated_range_max) }
            : undefined,
      };

      const displayText = formatWaiting(waiting);

      // confidence !== "realtime"이면 추정값 — 하네스 규칙
      const isEstimated = waiting.confidence !== "realtime";

      return { waiting, displayText, isEstimated };
    },
    enabled: !!restaurantId,
    // 에러 발생해도 앱 크래시 방지
    retry: 1,
  });
}
