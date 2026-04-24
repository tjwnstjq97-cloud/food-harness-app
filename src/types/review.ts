/**
 * 리뷰 도메인 타입
 * 하네스 규칙: source 없는 리뷰 사용 금지, positive/negative 분리 필수.
 */

/** 리뷰 감정 분류 */
export type ReviewSentiment = "positive" | "negative" | "neutral";

/** 개별 리뷰 */
export interface Review {
  id: string;
  text: string;
  rating: number;           // 1.0 ~ 5.0
  source: string;           // 필수: "naver" | "kakao" | "google" | "user" 등
  sentiment?: ReviewSentiment; // Edge Function 분류 결과. 없으면 neutral 취급.
  authorName?: string;      // 작성자 이름 (개인정보 주의)
  createdAt: string;        // ISO 8601
  userId?: string | null;   // Phase 19: 사용자 작성 리뷰일 때만 존재. 외부 수집은 NULL.
  isMine?: boolean;         // Phase 19: 클라이언트에서 현재 user와 매칭한 결과
}

/** 리뷰 요약 — 긍정/부정 반드시 분리 */
export interface ReviewSummary {
  totalCount: number;
  averageRating: number;    // 0.0 ~ 5.0
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveReviews: Review[];  // sentiment === "positive"
  negativeReviews: Review[];  // sentiment === "negative"
  neutralReviews: Review[];   // sentiment === "neutral" or undefined
  highlights: ReviewHighlight[];  // 자주 언급된 키워드
}

/** 리뷰 하이라이트 — 핵심 키워드 */
export interface ReviewHighlight {
  keyword: string;
  count: number;            // 언급 횟수
  sentiment: ReviewSentiment;
}

/** 리뷰 fetch 요청 */
export interface ReviewRequest {
  restaurantId: string;
  source?: string;          // 특정 출처만 가져올 때
  limit?: number;           // 기본 10
  sentimentFilter?: ReviewSentiment;
}

/** 리뷰 소스 목록 (확정값) */
export const REVIEW_SOURCES = ["naver", "kakao", "google", "user"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

// (Phase 17 정리) isValidReviewSource 제거 — 출처 검증은 hasValidSource(!!source)
// 만으로 충분하며, ReviewSource 타입 매칭은 사용처가 없었음.
