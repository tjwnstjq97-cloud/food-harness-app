/**
 * Auth 그룹 레이아웃
 * 로그인/회원가입 화면의 공통 레이아웃.
 * 이미 로그인된 사용자는 (tabs)로 리다이렉트.
 */
import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // 로딩 중에는 빈 화면 (스플래시가 커버)
  if (isLoading) return null;

  // 이미 로그인되어 있으면 메인으로
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
