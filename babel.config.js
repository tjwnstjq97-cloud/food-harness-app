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
    // node_modules는 기본적으로 babel transform이 안 적용됨.
    // zustand v5의 devtools/persist 등 ESM 미들웨어가 import.meta.env를 사용하는데,
    // Expo Web은 bundle을 type="module" 없이 로드하므로 SyntaxError로 앱 전체 크래시.
    // overrides로 zustand 트리만 강제 transform.
    overrides: [
      {
        test: /node_modules\/zustand\//,
        plugins: [["babel-plugin-transform-import-meta", { module: "ES6" }]],
      },
    ],
  };
};
