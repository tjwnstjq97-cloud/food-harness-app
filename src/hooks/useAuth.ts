/**
 * TASK 7: 인증 hook
 * Supabase Auth를 래핑한다.
 */
import { supabase } from "../lib/supabase";
import type { LoginCredentials, RegisterCredentials } from "../types/auth";

export function useAuthActions() {
  const signUp = async ({ email, password }: RegisterCredentials) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async ({ email, password }: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /**
   * 디스플레이 이름 업데이트 (Phase E)
   * auth.users.raw_user_meta_data.display_name 갱신.
   * 빈 문자열은 null로 정규화 (이메일 fallback이 동작하도록).
   */
  const updateDisplayName = async (displayName: string | null) => {
    const normalized = displayName?.trim() ? displayName.trim() : null;
    if (normalized && normalized.length > 30) {
      throw new Error("이름은 30자 이내로 입력해주세요.");
    }
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: normalized },
    });
    if (error) throw error;
    return data;
  };

  return { signUp, signIn, signOut, updateDisplayName };
}
