/**
 * 선택된 음식점 Zustand Store
 * 검색 결과 → 상세 페이지 전환 시 전체 Restaurant 객체를 전달한다.
 * Expo Router params에는 string만 전달 가능하므로, 객체는 스토어 경유.
 *
 * 하네스 규칙: region 없는 restaurant 객체 저장 금지.
 */
import { create } from "zustand";
import type { Restaurant } from "../types/restaurant";
import { isValidRegion } from "../types/region";

interface SelectedRestaurantStore {
  selected: Restaurant | null;
  setSelected: (restaurant: Restaurant | null) => void;
  clear: () => void;
}

export const useSelectedRestaurantStore = create<SelectedRestaurantStore>()(
  (set) => ({
    selected: null,
    setSelected: (restaurant) => {
      if (restaurant && !isValidRegion(restaurant.region)) {
        console.error(
          "[selectedRestaurantStore] region 없는 restaurant 저장 시도 차단"
        );
        return;
      }
      set({ selected: restaurant });
    },
    clear: () => set({ selected: null }),
  })
);
