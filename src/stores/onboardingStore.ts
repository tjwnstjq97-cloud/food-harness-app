/**
 * 온보딩 완료 여부 저장 store (Phase A)
 *
 * 첫 진입 시 region 선택 → 완료 플래그 저장 → 이후 진입에선 스킵.
 * AsyncStorage persist로 앱 재설치 전까지 유지.
 *
 * 수동 초기화: 설정 화면에서 "온보딩 다시 보기" 액션 (선택)
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingStore {
  /** 온보딩(첫 진입 region 선택)을 마쳤는지 여부 */
  onboarded: boolean;
  /** 온보딩 hydration이 끝났는지 (true가 되기 전엔 라우팅 결정 보류) */
  hydrated: boolean;

  /** 온보딩 완료 표시 */
  complete: () => void;
  /** 다시 온보딩 보기 (디버그/사용자 요청용) */
  reset: () => void;
  /** persist에서 hydration 완료 시 호출 */
  setHydrated: (v: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      onboarded: false,
      hydrated: false,
      complete: () => set({ onboarded: true }),
      reset: () => set({ onboarded: false }),
      setHydrated: (v: boolean) => set({ hydrated: v }),
    }),
    {
      name: "onboarding",
      storage: createJSONStorage(() => AsyncStorage),
      // hydrated 플래그는 persist에 저장하지 않음 (런타임 전용)
      partialize: (state) => ({ onboarded: state.onboarded }),
      onRehydrateStorage: () => (state) => {
        // hydration 완료 → 라우팅 결정 가능
        state?.setHydrated(true);
      },
    }
  )
);
