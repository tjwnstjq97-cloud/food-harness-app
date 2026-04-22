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
