/**
 * 카테고리 한글화 매핑
 * Google Places Types (영어) + Naver category (한글) 모두 처리.
 *
 * Google: "restaurant", "korean_restaurant", "cafe" → "음식점", "한식당", "카페"
 * Naver: "한식 > 백반,가정식" → 그대로 유지
 *
 * 하네스 규칙: source 없는 정보 표시 금지 → 매핑 실패 시 원본 유지.
 */

const GOOGLE_TYPE_TO_KO: Record<string, string> = {
  restaurant: "음식점",
  food: "음식점",
  cafe: "카페",
  bar: "바",
  bakery: "베이커리",
  meal_takeaway: "테이크아웃",
  meal_delivery: "배달",
  korean_restaurant: "한식당",
  japanese_restaurant: "일식당",
  chinese_restaurant: "중식당",
  italian_restaurant: "이탈리안",
  french_restaurant: "프렌치",
  mexican_restaurant: "멕시칸",
  thai_restaurant: "태국요리",
  vietnamese_restaurant: "베트남요리",
  indian_restaurant: "인도요리",
  pizza_restaurant: "피자",
  hamburger_restaurant: "버거",
  sushi_restaurant: "초밥",
  ramen_restaurant: "라멘",
  steak_house: "스테이크",
  seafood_restaurant: "해산물",
  bbq_restaurant: "바비큐",
  vegetarian_restaurant: "채식",
  dessert_restaurant: "디저트",
  ice_cream_shop: "아이스크림",
  coffee_shop: "커피숍",
  fast_food_restaurant: "패스트푸드",
};

/**
 * 카테고리 문자열을 한글 표시용으로 변환.
 * - 비어있으면 빈 문자열 반환
 * - 영어 _ 포함 (구글 type) → 한글 매핑 시도, 없으면 공백으로 변환
 * - 한글이거나 매핑 없는 경우 원본 유지
 */
export function localizeCategory(raw: string | undefined | null): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  if (!cleaned) return "";

  // 한글 포함 여부 (네이버는 이미 한글)
  if (/[가-힣]/.test(cleaned)) return cleaned;

  // 구글 type → 한글 매핑 시도
  const lower = cleaned.toLowerCase();
  if (GOOGLE_TYPE_TO_KO[lower]) return GOOGLE_TYPE_TO_KO[lower];

  // _ 가 있으면 빈칸으로 (e.g. "fine_dining" → "fine dining")
  return cleaned.replace(/_/g, " ");
}
