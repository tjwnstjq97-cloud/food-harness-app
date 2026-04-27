/**
 * 인증 관련 타입 정의
 */

export interface User {
  id: string;
  email: string;
  createdAt: string;
  /** 사용자 디스플레이 이름 — auth.users.raw_user_meta_data.display_name (Phase E) */
  displayName?: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}
