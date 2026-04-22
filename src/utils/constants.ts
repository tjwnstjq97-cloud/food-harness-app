/**
 * 공통 상수
 */

// 정보 없음 표기
export const NO_INFO = "정보 없음";
export const ESTIMATED_LABEL = "추정";

// 리뷰 감정
export const SENTIMENT_POSITIVE = "positive" as const;
export const SENTIMENT_NEGATIVE = "negative" as const;

// 리뷰 출처 (KR)
export const SOURCES_KR = ["naver", "kakao", "mangoplate"] as const;

// 리뷰 출처 (GLOBAL)
export const SOURCES_GLOBAL = ["google", "yelp", "tripadvisor"] as const;
