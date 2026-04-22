/**
 * 메뉴 도메인 타입
 * 출처 없는 메뉴 정보 표시 금지. 추정 가격은 표기 필수.
 */

/** 가격 확인 상태 */
export type PriceStatus = "confirmed" | "estimated" | "unknown";

/** 대표 메뉴 아이템 */
export interface MenuItem {
  name: string;
  price: number;            // 0이면 "가격 정보 없음"
  priceStatus: PriceStatus; // 가격 정보 신뢰도
  isSignature: boolean;     // 대표 메뉴 여부
  source: string;           // 출처 (예: "naver_place", "user_input") — 필수
  mentionCount?: number;    // 리뷰에서 언급된 횟수
  imageUrl?: string;        // 메뉴 사진 URL
  description?: string;     // 메뉴 설명
}

/** 메뉴 목록 응답 */
export interface MenuResult {
  items: MenuItem[];
  source: string;           // 데이터 출처
  fetchedAt: string;        // 조회 시각
}

/** 가격 표시 텍스트 */
export function formatMenuPrice(item: MenuItem): string {
  if (item.price === 0 || item.priceStatus === "unknown") {
    return "가격 정보 없음";
  }
  const priceStr = item.price.toLocaleString("ko-KR");
  if (item.priceStatus === "estimated") {
    return `약 ${priceStr}원 (추정)`;
  }
  return `${priceStr}원`;
}

/** 대표 메뉴만 필터링 (isSignature 우선, 없으면 mentionCount 상위) */
export function getSignatureMenus(items: MenuItem[], limit = 3): MenuItem[] {
  const signatures = items.filter((i) => i.isSignature);
  if (signatures.length >= limit) return signatures.slice(0, limit);

  // 부족하면 언급 횟수 순으로 채움
  const rest = items
    .filter((i) => !i.isSignature)
    .sort((a, b) => (b.mentionCount ?? 0) - (a.mentionCount ?? 0));

  return [...signatures, ...rest].slice(0, limit);
}
