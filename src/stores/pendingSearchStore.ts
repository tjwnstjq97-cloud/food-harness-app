/**
 * 탭 간 검색 트리거 Store
 * 지도 탭에서 빠른 검색 버튼을 탭하면 홈 탭으로 이동하면서 검색어를 자동 입력.
 * 홈 탭이 focus될 때 pendingQuery가 있으면 자동 검색 후 초기화.
 *
 * 하네스 규칙: 사용자 개인정보 저장 금지.
 */
import { create } from "zustand";

interface PendingSearchStore {
  pendingQuery: string | null;
  setPendingQuery: (q: string) => void;
  clearPendingQuery: () => void;
}

export const usePendingSearchStore = create<PendingSearchStore>()((set) => ({
  pendingQuery: null,
  setPendingQuery: (q: string) => set({ pendingQuery: q }),
  clearPendingQuery: () => set({ pendingQuery: null }),
}));
