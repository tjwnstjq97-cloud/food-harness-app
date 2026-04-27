/**
 * 온보딩 라우트 그룹 레이아웃
 * 헤더 없이 단일 화면 진행.
 */
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
