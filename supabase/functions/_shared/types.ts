/**
 * Edge Function 공통 타입
 * 클라이언트 ↔ Edge Function 간 인터페이스
 */

export type Region = "KR" | "GLOBAL";

/** 검색 요청 (클라이언트 → Edge Function) */
export interface SearchRequestBody {
  query: string;
  region: Region;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
}

/** 음식점 정규화 결과 */
export interface RestaurantResult {
  id: string;
  name: string;
  region: Region;
  category: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  source: string; // "naver" | "google"
}

/** 검색 응답 (Edge Function → 클라이언트) */
export interface SearchResponseBody {
  restaurants: RestaurantResult[];
  totalCount: number;
  hasMore: boolean;
  source: string;
}

/** 에러 응답 */
export interface ErrorResponse {
  error: string;
  code?: string;
}

// ─── 리뷰 자동 수집/요약 (Phase 21+) ─────────────────────────

/** 외부에서 수집한 원본 리뷰 (Naver 블로그 / Google reviews) */
export interface ExternalReview {
  text: string;
  source: string;            // "naver_blog" | "google_review"
  sourceUrl?: string;        // 원문 링크 (있는 경우)
  authorName?: string;       // 작성자 닉네임 (있는 경우)
  publishedAt?: string;      // ISO 8601
}

/** 출처 메타 — 요약 결과에 반드시 포함 (하네스 규칙: 출처 없는 요약 금지) */
export interface SummarySource {
  type: string;              // "naver_blog" | "google_review"
  count: number;             // 해당 출처에서 사용한 리뷰 개수
  urls?: string[];           // 원문 링크 모음 (앞에서 최대 N개)
}

/** 자동 추출 시그니처 메뉴 (리뷰에서 자주 언급된 메뉴명) */
export interface SummaryMenu {
  name: string;
  mentionCount: number;
}

/** AI 자동 요약 결과 — sentiment 분리 + 출처 첨부 필수 */
export interface ReviewSummaryV2 {
  positivePoints: string[];  // 좋다는 점 (한 줄씩)
  negativePoints: string[];  // 아쉬운 점 (한 줄씩)
  signatureMenus: SummaryMenu[]; // 자주 언급된 메뉴 (자동 추출)
  totalReviewCount: number;  // 요약에 사용한 리뷰 총 개수
  sources: SummarySource[];  // 출처별 메타 — 비어있으면 validator 실패
  generatedAt: string;       // ISO 8601
}

/** fetch-reviews 요청 */
export interface FetchReviewsRequest {
  restaurantName: string;
  region: Region;
  placeId?: string;          // GLOBAL일 때 Google place_id (있으면 Place Details 호출)
  limit?: number;            // 기본 10
}

/** fetch-reviews 응답 */
export interface FetchReviewsResponse {
  reviews: ExternalReview[];
  totalCount: number;
}

/** summarize-reviews 요청 */
export interface SummarizeReviewsRequest {
  restaurantName: string;
  reviews: ExternalReview[];
  region?: Region; // 캐시 키 분리용 (옵션). 미지정이면 "KR" 가정.
}

/** summarize-reviews 응답 */
export type SummarizeReviewsResponse = ReviewSummaryV2;
