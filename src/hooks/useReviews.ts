/**
 * 리뷰 hook
 * 하네스 규칙: 출처(source) 없는 리뷰 필터링, 긍정/부정 분리.
 * DB 테이블 미존재(42P01/PGRST301) 시 graceful fallback (앱 크래시 방지).
 *
 * DB 컬럼 매핑 (snake_case → camelCase):
 *   author_name → authorName
 *   created_at  → createdAt
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { filterValidReviews } from "../utils/validators";
import type { Review, ReviewSummary } from "../types/restaurant";

const EMPTY_SUMMARY: ReviewSummary = {
  totalCount: 0,
  averageRating: 0,
  positiveCount: 0,
  negativeCount: 0,
  neutralCount: 0,
  positiveReviews: [],
  negativeReviews: [],
  neutralReviews: [],
  highlights: [],
};

export function useReviews(restaurantId: string) {
  return useQuery({
    queryKey: ["reviews", restaurantId],
    queryFn: async (): Promise<ReviewSummary> => {
      // TODO: Edge Function 경유로 변경 (출처별 외부 API 호출)
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", restaurantId);

      // 테이블 미존재(42P01/PGRST301) → 빈 요약 반환 (앱 크래시 방지)
      if (error) {
        const isTableMissing =
          error.code === "42P01" ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist");
        if (isTableMissing) return EMPTY_SUMMARY;
        throw error;
      }

      // DB 컬럼(snake_case) → Review 타입(camelCase) 매핑
      const rawReviews: Review[] = (data ?? []).map((row) => ({
        id:         String(row.id ?? ""),
        text:       String(row.text ?? ""),
        rating:     Number(row.rating ?? 0),
        source:     String(row.source ?? ""),
        sentiment:  row.sentiment ?? "neutral",
        authorName: row.author_name ? String(row.author_name) : undefined,
        createdAt:  String(row.created_at ?? ""),
      }));

      // 출처 없는 리뷰 필터링 (하네스 규칙: 출처 없는 데이터 표시 금지)
      const validReviews = filterValidReviews(rawReviews);

      // 긍정/부정/중립 분리 (하네스 규칙: 감정 분리 필수)
      const positive = validReviews.filter((r) => r.sentiment === "positive");
      const negative = validReviews.filter((r) => r.sentiment === "negative");
      const neutral = validReviews.filter(
        (r) => !r.sentiment || r.sentiment === "neutral"
      );

      const ratings = validReviews.map((r) => r.rating);
      const avg =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        totalCount: validReviews.length,
        averageRating: Math.round(avg * 10) / 10,
        positiveCount: positive.length,
        negativeCount: negative.length,
        neutralCount: neutral.length,
        positiveReviews: positive,
        negativeReviews: negative,
        neutralReviews: neutral,
        highlights: [], // TODO: Edge Function에서 키워드 분석 결과 반영
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
    retry: 1,
  });
}
