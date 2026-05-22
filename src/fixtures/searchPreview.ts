import type { SearchResultCardMeta } from "../components/SearchResultCard";
import type { Restaurant } from "../types/restaurant";
import type { ReviewSummaryV2 } from "../types/review";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((nested) => {
      deepFreeze(nested);
    });
  }
  return value;
}

export const previewRecentQueries: ReadonlyArray<string> = deepFreeze([
  "성수 카페",
  "서울숲 점심",
  "웨이팅 적은 한식",
]);

export const previewEmptyRecentQueries: ReadonlyArray<string> = deepFreeze([]);

export const previewPopularQueries: ReadonlyArray<string> = deepFreeze([
  "성수 브런치",
  "을지로 와인바",
  "강남 혼밥",
  "홍대 라멘",
  "종로 한식",
]);

export const previewRestaurants: ReadonlyArray<Restaurant> = deepFreeze([
  {
    id: "mock_onion_seongsu",
    name: "어니언 성수",
    region: "KR",
    category: "카페,디저트",
    address: "서울 성동구 아차산로9길 8",
    phone: "02-0000-0000",
    latitude: 37.5446,
    longitude: 127.0558,
    rating: 4.4,
    reviewCount: 28,
  },
  {
    id: "mock_long_name_noodle",
    name: "성수동 아주 긴 이름의 수제면 연구소 본점 테스트 매장",
    region: "KR",
    category: "음식점>일식",
    address: "서울 성동구 연무장7가길 3",
    phone: "02-1111-1111",
    latitude: 37.5438,
    longitude: 127.0572,
    rating: 4.6,
    reviewCount: 34,
  },
  {
    id: "mock_long_chip_omakase",
    name: "서울숲 입구 아주아주 긴 이름의 계절 생선 오마카세와 작은 안주 연구소",
    region: "KR",
    category: "음식점>일식",
    address: "서울 성동구 왕십리로 아주 긴 골목명 123-45 2층 안쪽 자리",
    phone: "02-2222-2222",
    latitude: 37.5467,
    longitude: 127.0427,
    rating: 4.7,
    reviewCount: 21,
  },
  {
    id: "mock_seongsu_soup",
    name: "성수 담백국밥",
    region: "KR",
    category: "음식점>한식",
    address: "서울 성동구 연무장길 12",
    latitude: 37.5431,
    longitude: 127.0541,
    rating: 4.1,
    reviewCount: 9,
  },
  {
    id: "mock_low_evidence_taco",
    name: "타코 작은집",
    region: "KR",
    category: "음식점>멕시코",
    address: "서울 성동구 서울숲4길 15",
    latitude: 37.5461,
    longitude: 127.0412,
    rating: 4.0,
    reviewCount: 2,
  },
  {
    id: "mock_unknown_bistro",
    name: "소스 미확인 비스트로",
    region: "KR",
    category: "음식점>양식",
    address: "서울 성동구 성수이로 22",
    latitude: 37.5419,
    longitude: 127.0569,
  },
] satisfies Restaurant[]);

export const previewCardMeta: Readonly<Record<string, SearchResultCardMeta>> = deepFreeze({
  mock_onion_seongsu: {
    averageRating: 4.4,
    reviewCount: 28,
    sourceCount: 2,
    confidenceLabel: "신뢰도 높음",
    waitingLabel: "주말 대기 길음",
    reservationLabel: "예약 정보 없음",
    signatureMenus: ["앙버터", "소금빵"],
    businessStatusLabel: "영업중",
    businessStatusTone: "open",
    distanceLabel: "1.2km",
  },
  mock_long_name_noodle: {
    averageRating: 4.6,
    reviewCount: 34,
    sourceCount: 3,
    confidenceLabel: "신뢰도 높음",
    reservationLabel: "현장 등록",
    signatureMenus: ["토리파이탄", "수제 교자"],
    businessStatusLabel: "영업중",
    businessStatusTone: "open",
    distanceLabel: "900m",
  },
  mock_long_chip_omakase: {
    averageRating: 4.7,
    reviewCount: 21,
    sourceCount: 2,
    confidenceLabel: "신뢰도 높음",
    waitingLabel: "평일 저녁 2부 시작 전 짧은 대기 가능",
    reservationLabel: "예약 링크 확인 필요 · 전화 문의 권장",
    signatureMenus: [
      "계절 생선 숙성 사시미",
      "긴 이름 테스트용 전복 내장 소스와 초밥",
      "마무리 솥밥",
    ],
    businessStatusLabel: "브레이크타임 확인 필요",
    businessStatusTone: "unknown",
    distanceLabel: "1.6km",
  },
  mock_seongsu_soup: {
    averageRating: 4.1,
    reviewCount: 9,
    sourceCount: 1,
    confidenceLabel: "신뢰도 보통",
    reservationLabel: "전화 예약",
    signatureMenus: ["맑은국밥"],
    businessStatusLabel: "영업종료",
    businessStatusTone: "closed",
    distanceLabel: "1.8km",
  },
  mock_low_evidence_taco: {
    averageRating: 4.0,
    reviewCount: 2,
    sourceCount: 1,
    confidenceLabel: "근거 부족",
    signatureMenus: ["비리아 타코"],
    businessStatusLabel: "영업정보 확인 필요",
    businessStatusTone: "unknown",
    distanceLabel: "2.4km",
  },
  mock_unknown_bistro: {
    reviewCount: 0,
    sourceCount: 0,
    confidenceLabel: "근거 부족",
    signatureMenus: [],
    businessStatusLabel: "영업정보 없음",
    businessStatusTone: "unknown",
  },
} satisfies Record<string, SearchResultCardMeta>);

export const previewReviewSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: [
    "빵 종류가 다양하고 대표 메뉴 언급이 반복됩니다.",
    "공간 분위기와 사진 찍기 좋은 동선에 대한 긍정 리뷰가 많습니다.",
  ],
  negativePoints: [
    "주말에는 줄이 길고 좌석 확보가 어렵다는 언급이 있습니다.",
    "인기 메뉴는 늦은 시간에 품절될 수 있습니다.",
  ],
  signatureMenus: [
    { name: "앙버터", mentionCount: 8 },
    { name: "소금빵", mentionCount: 5 },
  ],
  waitingSignal: {
    label: "주말 대기 길음",
    evidence: "주말 줄이 길고 오픈런하면 대기가 짧다는 리뷰가 반복됨",
    minMinutes: 20,
    maxMinutes: 45,
    sourceCount: 4,
  },
  representativeReviews: [
    {
      text: "주말 오후에는 줄이 꽤 길었지만 앙버터와 소금빵은 다시 먹고 싶었어요.",
      source: "naver_blog",
      sourceUrl: "https://example.com/mock/naver-blog/onion",
    },
  ],
  totalReviewCount: 28,
  sources: [
    {
      type: "naver_blog",
      count: 18,
      urls: ["https://example.com/mock/naver-blog/onion"],
    },
    {
      type: "naver_cafe",
      count: 10,
      urls: ["https://example.com/mock/naver-cafe/onion"],
    },
  ],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);

export const previewNoWaitingSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: [
    "면 식감과 진한 국물에 대한 반복 언급이 있습니다.",
    "혼밥 좌석과 회전이 편하다는 리뷰가 확인됩니다.",
  ],
  negativePoints: [
    "점심 피크에는 내부가 좁게 느껴진다는 의견이 있습니다.",
  ],
  signatureMenus: [
    { name: "토리파이탄", mentionCount: 10 },
    { name: "수제 교자", mentionCount: 4 },
  ],
  waitingSignal: null,
  representativeReviews: [
    {
      text: "혼자 가도 부담 없고 진한 국물과 수제 교자가 같이 먹기 좋았습니다.",
      source: "google_review",
      sourceUrl: "https://example.com/mock/google/noodle",
    },
  ],
  totalReviewCount: 34,
  sources: [
    {
      type: "google_review",
      count: 16,
      urls: ["https://example.com/mock/google/noodle"],
    },
    {
      type: "naver_blog",
      count: 12,
      urls: ["https://example.com/mock/naver-blog/noodle"],
    },
    {
      type: "naver_cafe",
      count: 6,
      urls: ["https://example.com/mock/naver-cafe/noodle"],
    },
  ],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);

export const previewLowEvidenceSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: [
    "비리아 타코의 고기 양과 소스 조합을 좋게 본 리뷰가 있습니다.",
  ],
  negativePoints: [
    "확인된 리뷰 수가 적어 혼잡도와 대표 메뉴 판단은 제한적입니다.",
  ],
  signatureMenus: [{ name: "비리아 타코", mentionCount: 1 }],
  waitingSignal: null,
  representativeReviews: [
    {
      text: "비리아 타코 소스 조합은 좋았지만 확인 가능한 리뷰가 아직 적습니다.",
      source: "google_review",
      sourceUrl: "https://example.com/mock/google/taco",
    },
  ],
  totalReviewCount: 2,
  sources: [
    {
      type: "google_review",
      count: 2,
      urls: ["https://example.com/mock/google/taco"],
    },
  ],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);

export const previewLongTextSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: [
    "계절 생선의 숙성 정도와 작은 안주 구성이 좋다는 리뷰가 여러 출처에서 반복됩니다.",
    "조용한 좌석 간격, 설명이 자세한 접객, 술 페어링 선택지가 있다는 점이 장점으로 언급됩니다.",
    "긴 메뉴명과 긴 후기 문장에서도 카드와 요약 영역이 줄바꿈으로 안정적으로 유지되는지 확인하기 위한 mock 문장입니다.",
  ],
  negativePoints: [
    "예약 가능 시간이 제한적이고, 당일 방문은 원하는 시간대를 잡기 어렵다는 의견이 있습니다.",
    "일부 리뷰는 가격대가 높다고 느껴질 수 있어 특별한 식사 목적에 더 적합하다고 설명합니다.",
  ],
  signatureMenus: [
    { name: "계절 생선 숙성 사시미", mentionCount: 7 },
    { name: "전복 내장 소스와 초밥", mentionCount: 5 },
    { name: "마무리 솥밥", mentionCount: 4 },
  ],
  waitingSignal: {
    label: "예약 전후 짧은 대기 가능",
    evidence: "예약 시간 전후로 입장 대기가 있었다는 리뷰가 2개 출처에서 확인됨",
    sourceCount: 2,
  },
  representativeReviews: [
    {
      text: "예약 시간 전후로 잠깐 기다렸지만 계절 생선 구성과 설명이 자세했습니다.",
      source: "naver_blog",
      sourceUrl: "https://example.com/mock/naver-blog/long-omakase",
    },
  ],
  totalReviewCount: 21,
  sources: [
    {
      type: "naver_blog",
      count: 13,
      urls: ["https://example.com/mock/naver-blog/long-omakase"],
    },
    {
      type: "google_review",
      count: 8,
      urls: ["https://example.com/mock/google/long-omakase"],
    },
  ],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);

export const previewInvalidWaitingSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: ["국밥 국물이 깔끔하다는 언급이 확인됩니다."],
  negativePoints: ["웨이팅 시간 범위는 근거 구조가 맞지 않아 숨겨야 합니다."],
  signatureMenus: [{ name: "맑은국밥", mentionCount: 3 }],
  waitingSignal: {
    label: "점심 대기 가능",
    evidence: "대기 언급은 있으나 시간 범위와 sourceCount가 validator 규칙에 맞지 않음",
    minMinutes: 50,
    maxMinutes: 20,
    sourceCount: 0,
  },
  representativeReviews: [
    {
      text: "국물이 깔끔하다는 후기는 있으나 웨이팅 시간 구조는 신뢰할 수 없습니다.",
      source: "naver_blog",
      sourceUrl: "https://example.com/mock/naver-blog/soup",
    },
  ],
  totalReviewCount: 9,
  sources: [
    {
      type: "naver_blog",
      count: 9,
      urls: ["https://example.com/mock/naver-blog/soup"],
    },
  ],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);

export const previewInsufficientSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: [],
  negativePoints: [],
  signatureMenus: [],
  waitingSignal: null,
  totalReviewCount: 0,
  sources: [],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);

export const previewSourceLessSummary: ReviewSummaryV2 = deepFreeze({
  positivePoints: ["출처 없이 들어온 장점은 사실처럼 표시하지 않아야 합니다."],
  negativePoints: ["요약 본문이 있어도 sources가 없으면 정보 없음으로 처리합니다."],
  signatureMenus: [{ name: "출처 없는 메뉴", mentionCount: 1 }],
  waitingSignal: null,
  representativeReviews: [
    {
      text: "source가 비어 있는 문장은 UI에 대표 리뷰로 표시되면 안 됩니다.",
      source: "",
    },
  ],
  totalReviewCount: 3,
  sources: [],
  generatedAt: "2026-05-16T00:00:00Z",
} satisfies ReviewSummaryV2);
