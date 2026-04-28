/**
 * import-meta-safe-transformer.js
 *
 * Metro babel transformer wrapper.
 * Web 플랫폼 + node_modules 의 import.meta.env 참조를 안전한 객체로 사전 치환한다.
 *
 * 왜 필요?
 *  - Expo Web은 expo-router/entry.bundle 을 type="module" 없이 일반 <script>로 로드.
 *  - bundle 안에 살아남은 import.meta는 SyntaxError 유발 → 앱 전체 빈 화면.
 *  - babel overrides 는 node_modules 트리에 적용되지 않음 (Expo 기본 동작).
 *  - 따라서 transformer 단계에서 string 치환 (RegExp).
 *
 * 치환 규칙:
 *   import.meta.env  → ({MODE:"development",DEV:true,PROD:false})
 *   import.meta.url  → location.href
 *   import.meta      → ({})         (가장 마지막에 처리, 위 둘에 매칭 안 된 경우)
 *
 * native 빌드(ios/android)는 영향 없음 — platform === "web" 일 때만 동작.
 */
const upstreamPath =
  process.env.__ORIGINAL_BABEL_TRANSFORMER_PATH__ ||
  require.resolve("@expo/metro-config/babel-transformer");
const upstream = require(upstreamPath);

function safeReplaceImportMeta(src) {
  if (typeof src !== "string" || src.indexOf("import.meta") === -1) return src;
  return src
    .replace(/import\.meta\.env/g, '({MODE:"development",DEV:true,PROD:false})')
    .replace(/import\.meta\.url/g, "location.href")
    // 위에서 처리되지 않은 잔여 import.meta 만 빈 객체로 대체.
    // 주석 안의 "import.meta" 도 치환되지만 주석에 영향 없음.
    .replace(/import\.meta\b/g, "({})");
}

module.exports.transform = function (params) {
  const { filename, src, options } = params;
  const isWeb = options && options.platform === "web";
  const isNodeModule = filename && filename.includes("node_modules");

  if (isWeb && isNodeModule) {
    const patched = safeReplaceImportMeta(src);
    if (patched !== src) {
      return upstream.transform({ ...params, src: patched });
    }
  }
  return upstream.transform(params);
};
