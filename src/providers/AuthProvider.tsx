/**
 * Auth Provider
 * Supabase Auth 상태를 감시하고 앱 전체에 제공한다.
 */
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { AuthState } from "../types/auth";

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
        const dn = typeof meta.display_name === "string" ? meta.display_name : null;
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          createdAt: session.user.created_at,
          displayName: dn,
        });
      }
      setLoading(false);
    });

    // Auth 상태 변화 감시
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
        const dn = typeof meta.display_name === "string" ? meta.display_name : null;
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          createdAt: session.user.created_at,
          displayName: dn,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}
