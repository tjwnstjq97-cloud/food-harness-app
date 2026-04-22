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
import type { Review, ReviewHighlight, ReviewSentiment, ReviewSummary } from "../types/review";

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

interface KeywordRule {
  keyword: string;
  patterns: string[];
}

const POSITIVE_KEYWORDS: KeywordRule[] = [
  { keyword: "맛", patterns: ["맛", "delicious", "perfect", "amazing"] },
  { keyword: "국물", patterns: ["국물", "broth"] },
  { keyword: "면발", patterns: ["면발", "noodle"] },
  { keyword: "만두", patterns: ["만두"] },
  { keyword: "가성비", patterns: ["가성비", "합리적", "value"] },
  { keyword: "신선도", patterns: ["신선", "fresh"] },
  { keyword: "친절", patterns: ["친절", "설명", "kind", "friendly"] },
  { keyword: "분위기", patterns: ["분위기", "concept", "experience"] },
  { keyword: "소스", patterns: ["소스", "sauce"] },
  { keyword: "패티", patterns: ["패티", "patty"] },
  { keyword: "바삭함", patterns: ["바삭", "crispy"] },
  { keyword: "퀄리티", patterns: ["퀄리티", "quality"] },
];

const NEGATIVE_KEYWORDS: KeywordRule[] = [
  { keyword: "긴 대기", patterns: ["웨이팅", "기다", "오래", "줄", "queue", "wait"] },
  { keyword: "높은 가격", patterns: ["비싸", "가격", "expensive", "price"] },
  { keyword: "적은 양", patterns: ["양이 적", "양이 좀", "배가 차지", "small portion"] },
  { keyword: "평범함", patterns: ["평범", "ordinary"] },
  { keyword: "예약 필요", patterns: ["예약", "reservation"] },
];

function buildHighlights(
  reviews: Review[],
  sentiment: ReviewSentiment,
  rules: KeywordRule[]
): ReviewHighlight[] {
  const counts = new Map<string, number>();

  for (const review of reviews) {
    const text = review.text.toLowerCase();
    for (const rule of rules) {
      const mentioned = rule.patterns.some((pattern) =>
        text.includes(pattern.toLowerCase())
      );
      if (mentioned) {
        counts.set(rule.keyword, (counts.get(rule.keyword) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .sort(([aKeyword, aCount], [bKeyword, bCount]) => {
      if (bCount !== aCount) return bCount - aCount;
      return aKeyword.localeCompare(bKeyword, "ko");
    })
    .slice(0, 5)
    .map(([keyword, count]) => ({ keyword, count, sentiment }));
}

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
      const highlights = [
        ...buildHighlights(positive, "positive", POSITIVE_KEYWORDS),
        ...buildHighlights(negative, "negative", NEGATIVE_KEYWORDS),
      ];

      return {
        totalCount: validReviews.length,
        averageRating: Math.round(avg * 10) / 10,
        positiveCount: positive.length,
        negativeCount: negative.length,
        neutralCount: neutral.length,
        positiveReviews: positive,
        negativeReviews: negative,
        neutralReviews: neutral,
        highlights,
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
    retry: 1,
  });
}
