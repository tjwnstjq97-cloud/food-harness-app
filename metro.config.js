/**
 * metro.config.js
 *
 * Expo SDK 54 기본 Metro 설정 + Web 전용 import.meta 폴리필.
 * https://docs.expo.dev/guides/customizing-metro
 *
 * Web import.meta 우회:
 *   Expo Web은 expo-router/entry.bundle을 type="module" 없이 일반 <script>로 로드.
 *   이 경우 import.meta가 SyntaxError로 평가되어 앱 전체가 빈 화면이 됨.
 *   zustand v5 devtools 미들웨어 등이 import.meta.env를 참조 → 크래시 유발.
 *
 *   babel overrides/plugin은 node_modules에 적용되지 않으므로
 *   custom transformer wrapper로 web 번들에서만 import.meta.env → ({MODE:"development"})
 *   문자열 치환. 런타임 동작은 동일하지만 SyntaxError가 사라짐.
 *
 * ⚠️ 이 파일이 없으면:
 *   - expo-router 파일 기반 라우팅 해석 실패
 *   - @/* 경로 alias 미동작
 *   - SVG, 폰트 등 asset 변환 누락
 *   - Fast Refresh (HMR) 불안정
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 기본 transformer를 감싸서 web 플랫폼 + zustand 파일에 대해서만 import.meta 치환.
const defaultTransformerPath = config.transformer.babelTransformerPath;
config.transformer.babelTransformerPath = path.resolve(
  __dirname,
  "harness/scripts/import-meta-safe-transformer.js"
);
// 원본 path를 환경변수로 wrapper에게 전달 (require resolution 안정성)
process.env.__ORIGINAL_BABEL_TRANSFORMER_PATH__ = defaultTransformerPath;

module.exports = config;
