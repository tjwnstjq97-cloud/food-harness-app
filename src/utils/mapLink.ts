/**
 * 지도 딥링크 유틸리티
 * TASK 17-18: region 분기 강제.
 * KR → 네이버 지도, GLOBAL → 구글 지도, 앱 미설치 시 웹 폴백.
 *
 * 하네스 규칙: region 없이 지도 기능 사용 금지.
 */
import { Linking, Platform } from "react-native";
import type { Region } from "../types/region";
import type { Restaurant } from "../types/restaurant";

/** 지도 링크 파라미터 */
export interface MapLinkParams {
  latitude: number;
  longitude: number;
  name: string;
  region: Region; // 필수 — region 없이 호출 금지
}

/** 네이버 지도 딥링크 URL (KR) */
function buildNaverMapUrl(params: MapLinkParams): string {
  const { latitude, longitude, name } = params;
  const encodedName = encodeURIComponent(name);
  return `nmap://place?lat=${latitude}&lng=${longitude}&name=${encodedName}&appname=com.foodharness.app`;
}

/** 네이버 지도 웹 폴백 URL (KR) */
function buildNaverMapWebUrl(params: MapLinkParams): string {
  const { latitude, longitude, name } = params;
  const encodedName = encodeURIComponent(name);
  return `https://map.naver.com/v5/search/${encodedName}?c=${longitude},${latitude},15,0,0,0,dh`;
}

/** 구글 지도 딥링크 URL (GLOBAL) */
function buildGoogleMapUrl(params: MapLinkParams): string {
  const { latitude, longitude, name } = params;
  const encodedName = encodeURIComponent(name);
  if (Platform.OS === "ios") {
    return `comgooglemaps://?q=${encodedName}&center=${latitude},${longitude}`;
  }
  return `geo:${latitude},${longitude}?q=${encodedName}`;
}

/** 구글 지도 웹 폴백 URL (GLOBAL) */
function buildGoogleMapWebUrl(params: MapLinkParams): string {
  const { latitude, longitude, name } = params;
  const encodedName = encodeURIComponent(name);
  return `https://maps.google.com/?q=${encodedName}&ll=${latitude},${longitude}`;
}

/**
 * 지도 앱 열기
 * 1. region에 맞는 딥링크 시도
 * 2. 앱 미설치 시 웹 폴백
 * 3. lat/lng가 0이면 위치 정보 없음으로 처리
 */
export async function openMapApp(params: MapLinkParams): Promise<void> {
  const { latitude, longitude, region } = params;

  // 좌표 없음 처리
  if (latitude === 0 && longitude === 0) {
    // 좌표 없는 경우 — 이름으로 웹 검색 폴백
    const webUrl =
      region === "KR"
        ? buildNaverMapWebUrl(params)
        : buildGoogleMapWebUrl(params);
    await Linking.openURL(webUrl);
    return;
  }

  if (region === "KR") {
    const appUrl = buildNaverMapUrl(params);
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(buildNaverMapWebUrl(params));
    }
  } else {
    // GLOBAL
    const appUrl = buildGoogleMapUrl(params);
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(buildGoogleMapWebUrl(params));
    }
  }
}

/** Restaurant 객체에서 직접 지도 열기 (편의 함수) */
export async function openRestaurantMap(restaurant: Restaurant): Promise<void> {
  // 하네스 규칙: region 없는 지도 호출 금지
  if (!restaurant.region) {
    throw new Error("[mapLink] region 없이 지도 기능 호출 금지");
  }
  // 좌표 없는 경우 이름 기반 웹 검색으로 자동 폴백
  await openMapApp({
    latitude: restaurant.latitude ?? 0,
    longitude: restaurant.longitude ?? 0,
    name: restaurant.name,
    region: restaurant.region,
  });
}

/** 지도 링크 URL만 반환 (미리보기용, 열지 않음) */
export function getMapWebUrl(params: MapLinkParams): string {
  if (params.region === "KR") {
    return buildNaverMapWebUrl(params);
  }
  return buildGoogleMapWebUrl(params);
}
