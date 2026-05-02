/**
 * useReviewSummary — 외부 리뷰 자동 수집 + Claude 요약 (Phase 21+).
 *
 * 흐름:
 *   1. fetch-reviews Edge Function 호출 (Naver 블로그 / Google Place reviews)
 *   2. summarize-reviews Edge Function 호출 (Anthropic Claude)
 *   3. ReviewSummaryV2 반환
 *
 * 하네스 규칙:
 *   - 모든 요약에 sources 첨부 (validator 통과 필수)
 *   - 실패해도 빈 요약 반환 (앱 크래시 방지)
 *   - API Key는 클라이언트에 절대 노출되지 않음 (Edge Function 내부에서만)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Region } from "../types/region";
import type { ReviewSummaryV2 } from "../types/review";

const EMPTY_SUMMARY: ReviewSummaryV2 = {
  positivePoints: [],
  negativePoints: [],
  signatureMenus: [],
  totalReviewCount: 0,
  sources: [],
  generatedAt: new Date(0).toISOString(),
};

interface UseReviewSummaryArgs {
  restaurantId: string;
  restaurantName: string;
  region: Region;
  /** 입력 리뷰 최대 개수 (기본 25 — 블로그 60% + 카페 40%로 분할) */
  limit?: number;
  enabled?: boolean;
}

export function useReviewSummary({
  restaurantId,
  restaurantName,
  region,
  limit = 25,
  enabled = true,
}: UseReviewSummaryArgs) {
  return useQuery({
    queryKey: ["review-summary-v2", restaurantId, region, limit],
    queryFn: async (): Promise<ReviewSummaryV2> => {
      if (!restaurantName) return EMPTY_SUMMARY;

      // 1. fetch-reviews
      // GLOBAL일 때는 restaurantId가 Google place_id (search 결과의 id 그대로)
      const placeId = region === "GLOBAL" ? restaurantId : undefined;
      const { data: fetched, error: fetchErr } = await supabase.functions.invoke(
        "fetch-reviews",
        {
          body: { restaurantName, region, placeId, limit },
        }
      );

      if (fetchErr) {
        console.info("[useReviewSummary] fetch-reviews 오류:", fetchErr.message);
        return EMPTY_SUMMARY;
      }

      const reviews = Array.isArray(fetched?.reviews) ? fetched.reviews : [];
      if (reviews.length === 0) {
        return { ...EMPTY_SUMMARY, generatedAt: new Date().toISOString() };
      }

      // 2. summarize-reviews
      const { data: summary, error: sumErr } = await supabase.functions.invoke(
        "summarize-reviews",
        {
          body: { restaurantName, reviews },
        }
      );

      if (sumErr || !summary) {
        console.info(
          "[useReviewSummary] summarize-reviews 오류:",
          sumErr?.message ?? "no data"
        );
        return EMPTY_SUMMARY;
      }

      return {
        positivePoints: Array.isArray(summary.positivePoints)
          ? summary.positivePoints
          : [],
        negativePoints: Array.isArray(summary.negativePoints)
          ? summary.negativePoints
          : [],
        signatureMenus: Array.isArray(summary.signatureMenus)
          ? summary.signatureMenus
              .filter((m: { name?: unknown }) => m && typeof m.name === "string")
              .map((m: { name: string; mentionCount?: number }) => ({
                name: m.name,
                mentionCount: Number(m.mentionCount ?? 1) || 1,
              }))
          : [],
        totalReviewCount: Number(summary.totalReviewCount ?? 0),
        sources: Array.isArray(summary.sources) ? summary.sources : [],
        generatedAt: String(summary.generatedAt ?? new Date().toISOString()),
      };
    },
    enabled: enabled && !!restaurantId && !!restaurantName,
    staleTime: 1000 * 60 * 30, // 30분 캐시 (Anthropic 호출 비용 절약)
    retry: 1,
  });
}
