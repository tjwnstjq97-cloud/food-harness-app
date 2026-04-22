/**
 * 식당 핵심 타입 정의
 * 도메인별 타입(review, reservation, waiting, menu)은 각 파일에서 import.
 */
import type { Region } from "./region";
import type { ReviewSummary } from "./review";
import type { Reservation } from "./reservation";
import type { Waiting } from "./waiting";
import type { MenuItem } from "./menu";

/** 음식점 기본 정보 */
export interface Restaurant {
  id: string;               // "naver_{mapx}_{mapy}" | "{google_place_id}"
  name: string;             // HTML 태그 제거 후 저장
  region: Region;           // "KR" | "GLOBAL" — 필수
  category: string;
  address: string;          // 표시용 주소 문자열 (도로명 우선)
  phone?: string;           // PII 주의 — 로그 출력 금지
  latitude: number;
  longitude: number;
  thumbnailUrl?: string;
}

/** 음식점 상세 (통합) */
export interface RestaurantDetail {
  restaurant: Restaurant;
  reviews: ReviewSummary;
  reservation: Reservation | null;
  waiting: Waiting | null;
  menu: MenuItem[];
  fetchedAt: string;
}

/** 검색 요청 */
export interface SearchRequest {
  query: string;
  region: Region;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
}

/** 검색 결과 */
export interface SearchResult {
  restaurants: Restaurant[];
  totalCount: number;
  hasMore: boolean;
  source: string;           // 'naver' | 'google' — 출처 필수
  durationMs?: number;      // 검색 소요 시간 (ms)
}

/** 즐겨찾기 DB 행 타입 */
export interface FavoriteRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_region: Region;
  created_at: string;
}

/** 히스토리 DB 행 타입 */
export interface HistoryRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_region: Region;
  visited_at: string;
  created_at: string;
}

// re-export (하위 호환)
export type { Review, ReviewSummary } from "./review";
export type { Reservation } from "./reservation";
export type { Waiting } from "./waiting";
export type { MenuItem } from "./menu";
