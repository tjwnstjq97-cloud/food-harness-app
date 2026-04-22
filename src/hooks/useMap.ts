/**
 * TASK 6: 지도 hook — region 분기 강제
 * region 없이 지도 기능 호출 불가.
 */
import { useRegion } from "../providers/RegionProvider";
import type { Region } from "../types/region";

interface MapConfig {
  region: Region;
  isNaverMap: boolean;
  isGoogleMap: boolean;
  provider: "naver" | "google";
  searchFunctionName: "search-restaurant";
  searchApiPath: "/functions/v1/search-restaurant";
}

/**
 * 현재 region에 맞는 지도 설정을 반환한다.
 * region이 유효하지 않으면 에러를 throw한다.
 */
export function useMap(): MapConfig {
  const { region, isKR, isGlobal } = useRegion();

  if (!isKR && !isGlobal) {
    throw new Error(`유효하지 않은 region: ${region}. 지도 기능 사용 불가.`);
  }

  return {
    region,
    isNaverMap: isKR,
    isGoogleMap: isGlobal,
    provider: isKR ? "naver" : "google",
    // Edge Function 경유 — 실제 provider 분기는 함수 body의 region으로 처리한다.
    searchFunctionName: "search-restaurant",
    searchApiPath: "/functions/v1/search-restaurant",
  };
}
