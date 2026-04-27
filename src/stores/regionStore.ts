/**
 * Region Zustand Store
 * 현재 region(KR/GLOBAL) 상태를 관리한다.
 * 유효하지 않은 region 값은 설정 불가.
 *
 * persist: 온보딩에서 한 번 고른 region이 앱 재시작 후에도 유지되어야 함.
 * (이게 없으면 onboarded=true로 스킵되는데 region은 기본값 KR로 리셋되는 버그 발생)
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Region, isValidRegion } from "../types/region";

interface RegionStore {
  region: Region;
  setRegion: (region: Region) => void;
}

// Zustand v5: 커링 형식 create<T>()(...) — TypeScript 타입 추론 최적화
export const useRegionStore = create<RegionStore>()(
  persist(
    (set) => ({
      region: "KR", // 기본값: 국내
      setRegion: (region) => {
        if (!isValidRegion(region)) {
          console.error(`유효하지 않은 region: ${region}`);
          return;
        }
        set({ region });
      },
    }),
    {
      name: "region",
      storage: createJSONStorage(() => AsyncStorage),
      // 저장된 region이 손상된 경우 기본값으로 복귀
      migrate: (persisted) => {
        const r = (persisted as { region?: unknown })?.region;
        if (typeof r === "string" && isValidRegion(r as Region)) {
          return { region: r as Region };
        }
        return { region: "KR" as Region };
      },
      version: 1,
    }
  )
);
