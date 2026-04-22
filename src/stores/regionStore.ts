/**
 * Region Zustand Store
 * 현재 region(KR/GLOBAL) 상태를 관리한다.
 * 유효하지 않은 region 값은 설정 불가.
 */
import { create } from "zustand";
import { type Region, isValidRegion } from "../types/region";

interface RegionStore {
  region: Region;
  setRegion: (region: Region) => void;
}

// Zustand v5: 커링 형식 create<T>()(...) — TypeScript 타입 추론 최적화
export const useRegionStore = create<RegionStore>()((set) => ({
  region: "KR", // 기본값: 국내
  setRegion: (region) => {
    if (!isValidRegion(region)) {
      console.error(`유효하지 않은 region: ${region}`);
      return;
    }
    set({ region });
  },
}));
