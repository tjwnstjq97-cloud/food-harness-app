import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';
import { RegionProvider } from '../src/providers/RegionProvider';
import { ErrorBoundary as AppErrorBoundary } from '../src/components/ErrorBoundary';
import { useOnboardingStore } from '../src/stores/onboardingStore';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AppErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <RegionProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGuard />
            </ThemeProvider>
          </RegionProvider>
        </AuthProvider>
      </QueryProvider>
    </AppErrorBoundary>
  );
}

/**
 * 라우팅 가드:
 *  1) onboarding hydration 대기 → onboarded=false 면 (onboarding) 그룹으로
 *  2) 인증 안 됨 + 탭/상세 → (auth)/login
 *  3) 인증 됨 + (auth) 그룹 → (tabs)
 *
 * render 안에서 Redirect 금지 — useEffect 안에서만 router.replace 호출 (무한 루프 방지).
 */
function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const onboarded = useOnboardingStore((s) => s.onboarded);
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // onboarding persist hydration 전에는 라우팅 결정 보류
    if (!hydrated) return;
    if (isLoading) return;

    // expo-router typed routes는 새 (onboarding) 그룹 인덱싱 전엔 타입을 모를 수 있어
    // 비교/네비게이션 시 string으로 캐스팅 (런타임 동작은 동일).
    const seg0 = segments[0] as string | undefined;
    const inOnboarding = seg0 === '(onboarding)';
    const inAuthGroup = seg0 === '(auth)';

    // 1) 온보딩 미완료 → 온보딩으로 강제 이동 (다른 모든 분기보다 우선)
    if (!onboarded) {
      if (!inOnboarding) router.replace('/(onboarding)/region' as never);
      return;
    }

    // 2) 온보딩 완료 + 여전히 (onboarding) 그룹에 있으면 탭으로
    if (onboarded && inOnboarding) {
      router.replace('/(tabs)');
      return;
    }

    // 3) 인증 분기
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, hydrated, onboarded, segments]);

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="restaurant/[id]"
        options={{
          title: "음식점 상세",
          headerBackTitle: "검색",
          headerTintColor: "#FF6B35",
        }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
