/**
 * metro.config.js
 *
 * Expo SDK 54 기본 Metro 설정.
 * https://docs.expo.dev/guides/customizing-metro
 *
 * ⚠️ 이 파일이 없으면:
 *   - expo-router 파일 기반 라우팅 해석 실패
 *   - @/* 경로 alias 미동작
 *   - SVG, 폰트 등 asset 변환 누락
 *   - Fast Refresh (HMR) 불안정
 */
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
