/**
 * babel.config.js
 *
 * Expo SDK 54 + React Native 0.81 + Reanimated 4.x 기준 설정.
 *
 * react-native-worklets/plugin:
 *   Reanimated 4.x에서 worklets가 별도 패키지로 분리됨.
 *   babel.config.js 없으면 워크렛 변환이 전혀 적용되지 않음.
 *
 * ⚠️ 이 파일이 없으면:
 *   - JSX 변환 미적용 (앱 시작 자체 불가)
 *   - react-native-reanimated useAnimatedStyle 등 런타임 오류
 *   - Metro 번들러 transform 에러
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"],
  };
};
