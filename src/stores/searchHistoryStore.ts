/**
 * 최근 검색어 Zustand Store
 * AsyncStorage 기반으로 앱 재시작 후에도 유지.
 * 최대 10개 저장. 중복 제거. 최신 항목이 앞으로.
 * timestamps: 각 검색어의 마지막 검색 시각 (ISO 문자열)
 *
 * 하네스 규칙: 사용자 개인정보 저장 금지 → 검색어만 저장 (user_id, 위치 등 금지).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_HISTORY = 10;

interface SearchHistoryStore {
  queries: string[];                   // 최근 검색어 목록 (최신순)
  timestamps: Record<string, string>;  // query → ISO 날짜 문자열
  addQuery: (query: string) => void;
  removeQuery: (query: string) => void;
  clearAll: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set, get) => ({
      queries: [],
      timestamps: {},

      addQuery: (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const existing = get().queries.filter((q) => q !== trimmed);
        const updated = [trimmed, ...existing].slice(0, MAX_HISTORY);
        const ts = { ...get().timestamps, [trimmed]: new Date().toISOString() };
        set({ queries: updated, timestamps: ts });
      },

      removeQuery: (query: string) => {
        const ts = { ...get().timestamps };
        delete ts[query];
        set({
          queries: get().queries.filter((q) => q !== query),
          timestamps: ts,
        });
      },

      clearAll: () => set({ queries: [], timestamps: {} }),
    }),
    {
      name: "search-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** 상대적 시간 표시 유틸 ("방금 전", "3시간 전", "어제" …) */
export function formatRelativeTime(isoString: string | undefined): string {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
