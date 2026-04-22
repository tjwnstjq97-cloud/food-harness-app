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

  return { signUp, signIn, signOut };
}
