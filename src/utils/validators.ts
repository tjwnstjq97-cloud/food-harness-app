/**
 * 클라이언트 측 데이터 검증
 * 하네스 validator 규칙의 TypeScript 버전.
 * 서버에서도 검증하지만, 클라이언트에서도 사전 검증한다.
 *
 * (Phase 17 정리): 미사용 export 제거 — formatReservation, validateRegion,
 * hasValidSource(내부 함수로 강등). region 검증은 isValidRegion 직접 사용.
 */
import type { Review, Waiting } from "../types/restaurant";
import { NO_INFO, ESTIMATED_LABEL } from "./constants";

/** 리뷰에 출처가 있는지 검증 (내부용). */
function hasValidSource(review: Review): boolean {
  return !!review.source;
}

/** 출처 없는 리뷰를 필터링한다. */
export function filterValidReviews(reviews: Review[]): Review[] {
  return reviews.filter(hasValidSource);
}

/** 웨이팅 정보를 포맷팅. 근거 없으면 "추정" 표기. */
export function formatWaiting(waiting: Waiting | null): string {
  if (!waiting) return NO_INFO;
  if (!waiting.evidence) {
    return `약 ${waiting.minutes}분 (${ESTIMATED_LABEL})`;
  }
  return `약 ${waiting.minutes}분`;
}
