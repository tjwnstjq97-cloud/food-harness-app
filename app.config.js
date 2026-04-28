/**
 * Expo 동적 설정.
 * - 지도 SDK용 클라이언트 키는 빌드 타임에 process.env에서 주입.
 *   (app.json에 하드코딩하면 CLAUDE.md "API Key 하드코딩 금지" 위반)
 * - 사용자가 .env에 다음 키 채우고 prebuild/build 실행해야 지도 동작:
 *     EXPO_PUBLIC_NAVER_MAP_CLIENT_ID
 *     EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY
 *     EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY
 *   (EXPO_PUBLIC_ 접두사 — 클라이언트 번들에 들어가지만 지도 SDK 키는 plist/manifest에
 *    어차피 노출되므로 동급. 노출 시 Naver/Google 콘솔에서 bundleId 제한 필수.)
 */
module.exports = () => {
  const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID || "";
  const googleMapsIosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY || "";
  const googleMapsAndroidKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || "";

  return {
    expo: {
      name: "food-harness-app",
      slug: "food-harness-app",
      version: "0.1.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "foodharnessapp",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#F7F1E7",
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.foodharness.app",
        config: {
          googleMapsApiKey: googleMapsIosKey,
        },
        infoPlist: {
          NSLocationWhenInUseUsageDescription:
            "주변 음식점을 보여드리려면 위치 권한이 필요합니다.",
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon.png",
          backgroundColor: "#F7F1E7",
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: "com.foodharness.app",
        config: {
          googleMaps: {
            apiKey: googleMapsAndroidKey,
          },
        },
        permissions: [
          "android.permission.ACCESS_COARSE_LOCATION",
          "android.permission.ACCESS_FINE_LOCATION",
        ],
      },
      web: {
        bundler: "metro",
        // "single" (SPA): 클라이언트 전용 — AsyncStorage/window 접근이 정적 렌더 시점에
        // 발생하지 않도록 SSR 비활성. Supabase auth 초기화가 server에서 실행되어
        // window 미정의로 크래시하던 문제 해결.
        output: "single",
        favicon: "./assets/images/favicon.png",
      },
      plugins: [
        "expo-router",
        [
          "expo-build-properties",
          {
            ios: {
              deploymentTarget: "15.1",
              useFrameworks: "static",
            },
            android: {
              compileSdkVersion: 35,
              targetSdkVersion: 35,
              minSdkVersion: 24,
            },
          },
        ],
        [
          "@mj-studio/react-native-naver-map",
          {
            client_id: naverMapClientId,
            ios: {
              NSLocationWhenInUseUsageDescription:
                "주변 음식점을 보여드리려면 위치 권한이 필요합니다.",
            },
          },
        ],
        [
          "expo-location",
          {
            locationWhenInUsePermission:
              "주변 음식점을 보여드리려면 위치 권한이 필요합니다.",
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
      },
    },
  };
};
