# Proposed Features (사용자 승인 대기)

> 라이브러리 설치, 외부 API 키, 네이티브 빌드, 결제 계정이 필요한 작업.
> CLAUDE.md "승인 없는 라이브러리 설치 금지" 규칙으로 인해 자율 작업에서 제외됨.
>
> 마지막 업데이트: 2026-04-25

---

## 🔴 높은 영향 (앱의 핵심 가치 향상)

### 1. 실제 지도 SDK 연동 (Phase 18)
- **필요**: `react-native-naver-map`, `react-native-maps` 설치 + expo prebuild 재실행
- **이유**: 현재 지도 탭은 placeholder (faux 캔버스 + 핀)
- **영향**: KR/GLOBAL region 분기 실제 지도 동작
- **준비물**:
  - `NAVER_MAP_CLIENT_ID` (Naver Cloud Console)
  - `GOOGLE_MAPS_API_KEY` (Google Cloud Console — Maps SDK iOS/Android 활성화)
- **승인 시 작업**:
  1. 패키지 설치
  2. `app.json` plugins 추가
  3. `npx expo prebuild --clean`
  4. `app/(tabs)/map.tsx` 실제 SDK로 교체
  5. 검색 결과 핀 표시
  6. 핀 탭 → 상세 페이지

### 2. 외부 리뷰/메뉴/웨이팅 자동 수집 (Phase 21)
- **필요**: Edge Function 확장 + 외부 API 키
- **이유**: 현재 도메인 데이터는 모두 시드 (수동 입력)
- **세부**:
  - Google Places Details API → reviews 5개, photos, opening_hours
  - Naver Place API (또는 블로그 검색 API) → 한국 식당 메뉴/리뷰
- **법적 주의**: 외부 리뷰 텍스트 그대로 보여주는 건 회색지대 — 요약/통계만 안전

### 3. AI 리뷰 요약 (장점/단점 LLM 분석)
- **필요**: `ANTHROPIC_API_KEY` Edge Function 환경변수
- **현재 대안**: Phase 18에서 룰 기반 키워드 칩으로 해결 (12 + 12개 키워드)
- **장점**: 시드에 없는 새 키워드도 자동 추출
- **주의**: handoff.md "한 줄 요약 금지" 규칙과 충돌 가능 → 칩 형태만 LLM으로 보강하는 안 검토

---

## 🟡 중간 영향 (UX 향상)

### 4. 위치 기반 "내 주변" 검색 (Phase 20)
- **필요**: `expo-location` 설치 + 위치 권한 prompt
- **작업**: 거리·평점·가격대·영업중 필터, 정렬 옵션
- **승인 시**: 5분 작업

### 5. 푸시 알림 + 딥링크 (Phase 22)
- **필요**: `expo-notifications` + APNs (Apple Push) + FCM (Firebase) 셋업
- **작업**: 예약 알림, 웨이팅 호출, restaurant/[id] 딥링크
- **유저 셋업**: Apple Developer 계정, Firebase 프로젝트

### 6. 다국어 i18n (Phase 25)
- **필요**: `expo-localization` + `i18next` + `react-i18next`
- **이유**: 현재 한국어만, GLOBAL 사용자용 영어가 일부만 존재
- **작업**: locale 키 추출, en.json/ko.json/ja.json 작성

### 7. 사용자 리뷰 사진 업로드 (Phase 19 확장)
- **필요**: Supabase Storage bucket 셋업 + `expo-image-picker` 설치
- **현재 상태**: 텍스트 리뷰 작성/수정/삭제는 Phase 19에서 완료 (2026-04-25). 사진 첨부만 남음

---

## 🟢 낮은 영향 (운영 향상)

### 8. Crash 리포트 + Analytics (Phase 26)
- **선택지**: Sentry / PostHog / Amplitude
- **필요**: 계정 + DSN/API key
- **작업**: SDK 설치, init, 핵심 이벤트 (검색/즐겨찾기/예약 클릭) 트래킹

### 9. E2E 테스트 (Phase 27 확장)
- **필요**: `detox` 설치 + iOS Simulator 빌드
- **현재**: Phase 27에서 단위 테스트만 추가
- **작업**: 로그인 → 검색 → 즐겨찾기 → 상세 시나리오

### 10. 배포 (Phase 28)
- **필요**:
  - Apple Developer Program ($99/year)
  - Google Play Console ($25 1회)
  - EAS 계정 (Expo)
  - 앱 아이콘, 스크린샷, 스토어 메타데이터
- **작업**: `eas.json` 설정, EAS Build, TestFlight/Play 업로드

---

## 🔵 나이스 투 해브 (검토 필요)

### 11. 결제/구독 (Phase 29)
- 프리미엄 (광고 제거, 무제한 즐겨찾기 등)
- `react-native-iap` + Apple/Google In-App Purchase 등록
- 가치 제안 검토 필요 — 진짜 결제할 만한 가치가 있나?

### 12. 소셜 로그인 (Phase 30)
- Apple/Google/Kakao OAuth
- Supabase Auth는 다 지원함 — 콘솔 셋업만 하면 됨
- 한국 사용자에게는 Kakao 로그인이 큰 이점

### 13. 친구 초대 + 공유 리스트 (Phase 31)
- 즐겨찾기 공개 리스트 (URL 공유)
- 친구 추가 → 서로의 방문 기록 보기
- 새로운 DB 테이블 + RLS 설계 필요

---

## 운영 메모

- 이 파일에 항목 추가/제거할 때는 우선순위(🔴/🟡/🟢/🔵) 표시할 것
- 승인 후 작업 완료되면 → `docs/handoff.md` "Recent Work Log"로 옮기고 이 파일에서 제거
- 승인 거절되면 → "🚫 거절 이력" 섹션 추가해서 기록 (재제안 방지)

## 🚫 거절 이력 (재제안 금지)

- **한 줄 리뷰 요약** (2026-04-23 이전) — 사용자가 "보고 싶지 않다"고 명시. 칩(키워드+횟수) 형태만 유지.
- **메뉴 추천 별도 기능** — 대표 메뉴 섹션이 이미 커버.
