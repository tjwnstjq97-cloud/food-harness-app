/**
 * Region 타입 및 상수
 * 국내(KR)와 국외(GLOBAL) 분기의 기준.
 * region 분기 없이 지도 기능 구현 금지.
 */

export const REGION_KR = "KR" as const;
export const REGION_GLOBAL = "GLOBAL" as const;

export type Region = typeof REGION_KR | typeof REGION_GLOBAL;

export const VALID_REGIONS: readonly Region[] = [REGION_KR, REGION_GLOBAL];

export function isValidRegion(value: string): value is Region {
  return VALID_REGIONS.includes(value as Region);
}
