/**
 * Auth Zustand Store
 * 로그인 상태를 관리한다.
 */
import { create } from "zustand";
import type { User } from "../types/auth";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// Zustand v5: 커링 형식 create<T>()(...) — TypeScript 타입 추론 최적화
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
