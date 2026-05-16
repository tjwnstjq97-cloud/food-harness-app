# Handoff — Codex Lead Agent 인수인계

> Last updated: 2026-05-06
> 이전 작업자: Claude (Sonnet 4.5)
> 다음 작업자: Codex Lead Agent
> 인수인계 대상: food-harness-app (음식점 탐색/리뷰 자동 요약 앱)

---

## 1. 프로젝트 목표

**한 줄 정의**: 음식점 이름/지역을 검색하면 외부에 흩어진 블로그·카페 리뷰를 자동 수집해 AI(Claude)로 긍정/부정 포인트 + 시그니처 메뉴까지 요약해주는 모바일/웹 앱.

**제품 본질** — 사용자가 직접 리뷰를 쓰는 게 아님. 이미 인터넷에 존재하는 후기들을 모아 "이 음식점은 뭐가 좋고 뭐가 아쉬운지" 한눈에 보여주는 것이 핵심. (과거 Phase 19에서 사용자 작성 리뷰 시스템을 만들었다가 제품 비전과 맞지 않아 UI는 숨기고 DB/RLS는 보존 중.)

**Region 분기**:
- KR (한국): 네이버 검색 + 네이버 블로그/카페 + 네이버 지도 SDK
- GLOBAL (해외): 구글 Places (New) + 구글 리뷰 + react-native-maps

**플랫폼**: iOS / Android / Web (모두 같은 Expo SDK 54 코드베이스)

---

## 2. 현재 구현 상태

| 영역 | 상태 | 비고 |
|---|---|---|
| 백엔드 (Edge Functions 3종) | 🟢 100% 배포 완료 | search-restaurant, fetch-reviews, summarize-reviews |
| 검색 (정확도/속도) | 🟢 개선 완료 | 병렬 다중 정렬 + placeholderData |
| AI 자동 요약 | 🟢 완료 | 긍정/부정/메뉴 단일 Claude 호출 |
| 캐시 시스템 | 🟡 코드 배포 완료, 사용자 SQL 실행 대기 | migrations/005 미적용 시 silent fall-through |
| 인증 (회원가입/로그인) | 🟡 코드 완료, Supabase Email Confirm 설정 대기 | signup 200, login은 confirm 필요 |
| 웹 빌드 | 🟢 부팅 OK | import.meta + SSG 이슈 해결 완료 |
| iOS/Android 빌드 | 🟡 코드 완료, 사용자 prebuild + 지도 키 발급 대기 | RealMapView.native.tsx 동적 require |
| 디자인 | 🟡 cozyTheme 기본 적용, Figma MCP 준비됨 | Figma 디자인 입력 대기 |
| 18 validators + 7 fail-cases | 🟢 모두 PASS | npm run check |

---

## 3. 완료된 작업

### Phase 1~20 (이전 작업자)
- 기본 검색 / 상세 페이지 / 즐겨찾기 / 히스토리 / 검색 기록
- Cozy theme 디자인 시스템
- 카테고리 필터, 정렬, 페이지네이션
- 온보딩, 인증 게이트, 스켈레톤 로딩
- 18개 Python validator (하네스 규칙 강제)

### Phase 21+ (이번 세션, 2026-04-28 ~ 05-02)
1. **외부 리뷰 자동 수집 파이프라인** (`feat: 374ac3a`)
   - fetch-reviews / summarize-reviews Edge Function 신규
   - ReviewSummaryView 컴포넌트 (👍 좋은점 / 👎 아쉬운점 + 출처 칩)
   - Phase 19 사용자 리뷰 UI 숨김 (코드/DB/RLS 보존)
   - `no_oneline_summary` validator 삭제 (자동 요약 막던 잘못된 규칙)

2. **Web 빌드 정상화** (`feat: 58fd724`)
   - SSG → SPA (`web.output: "single"`)
   - Metro custom transformer로 zustand의 `import.meta.env` 폴리필 치환
   - RealMapView .native/.web 분기 + .d.ts

3. **리뷰 수집량 3배 + UI 순서 개선** (`feat: a5b2775`)
   - 네이버 카페 검색 추가 (blog 15 + cafe 10 = 25건)
   - 리뷰 요약을 한눈에보기 바로 아래로 이동
   - useReviewSummary 기본 limit 10 → 25

4. **검색 정확도 2배 + 체감 렉 제거** (`fix: e6af76b`)
   - search-restaurant: sim/comment 정렬 + 부스트 쿼리 병렬 호출 (allSettled)
   - useSearch: `placeholderData: keepPreviousData`
   - 디바운스 300 → 250ms

5. **대표 메뉴 자동 추출** (`feat: 165d30f`)
   - summarize-reviews에 signatureMenus 작업 추가 (단일 Claude 호출 확장)
   - DB 메뉴 우선, 비면 자동 추출 메뉴 fallback
   - 검증: 어니언 성수 → 앙버터/초코소금빵/헤이즐넛 두쫀쿠 등 5개 추출

6. **DB 캐시 시스템** (`feat: 6380381`)
   - migrations/005: search_cache + review_summary_cache + RLS service_role only
   - `_shared/cache.ts` 유틸 (SHA-256 staleness, silent fall-through)
   - summarize-reviews: source_hash(URL 정렬+SHA256) 동일 시 Claude 호출 0회
   - search-restaurant: TTL 24h
   - X-Cache: HIT 헤더

---

## 4. 진행 중인 작업

**없음.** 마지막 커밋(`6380381`)까지 모두 완료 상태로 마무리. TodoList 0건 in_progress.

다만 사용자 측에서 다음 두 가지 대기 중:
- Supabase Auth → Email Confirm OFF (로그인 게이트 해소)
- Supabase SQL Editor → `migrations/005` 실행 (캐시 활성화)

---

## 5. 남은 작업

### 우선순위 P0 (사용자 액션 끝나면 즉시 검증)
- Supabase 마이그레이션 005 실행 후 캐시 HIT 동작 end-to-end 검증
  - 어니언 성수 2회 호출 → 2번째에 `X-Cache: HIT` 응답 확인
  - cache miss → Claude 호출 → cache write 확인 (Supabase Dashboard에서 `review_summary_cache` 행 조회)

### 우선순위 P1 (백엔드)
- **fetch-reviews 캐시 추가** (TTL 1h 정도, 너무 자주 호출되면 비용 누적)
  - source_hash 갱신을 위해 fetch는 fresh 유지가 맞지만, 같은 음식점 1시간 내 재조회는 캐시 가능
- **Google Places 리뷰 추가 출처** (GLOBAL용)
  - 현재 fetch-reviews의 fetchGooglePlaceReviews는 최대 5건만 반환 (Google 정책)
  - place_id 외에 텍스트 검색으로 보강 가능
- **카카오맵 API** (KR 추가 출처) — 별도 키 + 약관 검토 필요

### 우선순위 P2 (프론트엔드)
- **지도 탭 UX 개선** — 현재는 grid fallback. 사용자가 prebuild 하면 실제 지도 표시되지만 UX 다듬어야 함
  - 현재 위치 자동 중심
  - 마커 클러스터링 (가까운 마커 묶기)
- **리뷰 요약 캐시 indicator** — UI에서 "캐시됨 / 최신" 표시 (선택)
- **상세 페이지 공유 기능** — 음식점 deep link
- **PWA manifest.json** — 웹에서 "홈 화면에 추가" 가능

### 우선순위 P3 (디자인/품질)
- **Figma 디자인 적용** — MCP 준비됨, 사용자가 Figma URL 주면 적용
- **다크모드** — cozyTheme에 darkColors 추가
- **i18n** — 현재 한국어 하드코딩, GLOBAL region용 영어 번역
- **에러 바운더리 강화** — Sentry 등 에러 모니터링 연결

### 우선순위 P4 (배포)
- **iOS TestFlight 배포 파이프라인** — EAS Build 설정
- **Android Play Store 내부 테스트** — EAS Build + AAB
- **Web 프로덕션 배포** — Vercel/Cloudflare Pages

---

## 6. 중요한 결정사항

### A. 제품 비전 — 자동 요약이 본질, 사용자 작성 리뷰는 부가
- Phase 19 사용자 작성 리뷰는 의도와 다른 방향이었음
- 결정: UI 숨김 + DB/RLS/hooks 보존 (향후 "내 메모" 부활 대비)
- 관련 파일: `src/hooks/useSubmitReview.ts`, `src/components/ReviewSubmitForm.tsx`, `supabase/migrations/004_add_user_reviews.sql`
- 절대 이 코드/마이그레이션 지우지 말 것

### B. 캐시 stale 감지는 source_hash 기반
- 단순 TTL은 "리뷰가 안 바뀌어도 만료" → 토큰 낭비
- source_hash는 "리뷰가 진짜 바뀌었을 때만 stale" → 정확
- fetch-reviews는 캐시 안 함 (매번 fresh로 stale 감지에 사용)

### C. 검색 정확도 vs 속도
- Naver Local API display max 5, start>1 미지원 (시도했으나 실패)
- 대안: 3개 정렬/쿼리 병렬 호출 + dedupe → 결과 2~3배 + 지연 ≈ 단일 호출
- 결정: 정확도 우선, 평균 500ms는 허용 가능

### D. 부스트 쿼리는 조건부
- "어니언 성수" 같은 정확 가게명에 "맛집" 부스트 붙이면 결과 흐려짐
- 결정: 음식 키워드가 없는 경우에만 부스트, 정확 매칭은 그대로

### E. Expo Web import.meta 우회는 Metro transformer 레벨
- babel-preset-expo는 node_modules 변환 안 함
- 해결: `harness/scripts/import-meta-safe-transformer.js`가 web+node_modules 파일에서 RegExp 치환

### F. 지도 SDK는 platform extension
- `RealMapView.native.tsx` (실제 SDK 동적 require)
- `RealMapView.web.tsx` (fallback만 렌더)
- `RealMapView.d.ts` (공통 타입)

---

## 7. 절대 건드리면 안 되는 것

1. **`.env` 파일** — CLAUDE.md 절대 규칙. 읽지도 쓰지도 말 것
2. **`.env.example` 의 실제 값** — 구조 설명 주석만 수정 가능
3. **Supabase Service Role Key 하드코딩** — Edge Function 내부 `Deno.env.get` 만 사용
4. **Phase 19 사용자 리뷰 코드/DB/RLS** — UI만 숨김, 로직은 미래 부활 대비 보존
   - `src/hooks/useSubmitReview.ts`
   - `src/components/ReviewSubmitForm.tsx`
   - `supabase/migrations/004_add_user_reviews.sql`
   - `reviews` 테이블의 `user_id` 컬럼 + RLS policy
5. **18 validators** — 모두 PASS 상태 유지. 새 기능 추가 시 관련 validator도 추가
6. **하네스 규칙** (CLAUDE.md):
   - 리뷰 출처(source) 없이 요약 금지
   - 예약/웨이팅 정보 없으면 "정보 없음" 처리 (추측 금지)
   - API Key 하드코딩 금지
7. **`SUPABASE_SERVICE_ROLE_KEY`** 를 클라이언트 코드에서 절대 import 금지
8. **Metro custom transformer (`harness/scripts/import-meta-safe-transformer.js`)** — 웹 빌드 부팅에 필수, 지우면 빈 화면

---

## 8. 관련 파일/폴더

### 핵심 진입점
- `app.config.js` — Expo 동적 설정 (지도 SDK 키 env 주입)
- `app/_layout.tsx` — 루트 layout (Providers)
- `app/(tabs)/index.tsx` — 홈 검색 탭
- `app/(tabs)/map.tsx` — 지도 탭
- `app/restaurant/[id].tsx` — 음식점 상세 페이지 (메인 UI)

### Edge Functions (Supabase Deno)
- `supabase/functions/search-restaurant/index.ts` — 검색 (캐시 적용)
- `supabase/functions/fetch-reviews/index.ts` — 리뷰 수집 (캐시 X)
- `supabase/functions/summarize-reviews/index.ts` — Claude 요약 (캐시 적용)
- `supabase/functions/_shared/types.ts` — 공용 타입
- `supabase/functions/_shared/cors.ts` — CORS 헤더
- `supabase/functions/_shared/cache.ts` — 캐시 유틸 (신규)

### DB
- `supabase/migrations/001_create_tables.sql` ~ `005_add_edge_function_cache.sql`
- 005는 사용자가 SQL Editor에서 직접 실행해야 함

### 클라이언트 hooks
- `src/hooks/useSearch.ts` — Edge Function 호출 + DB fallback
- `src/hooks/useReviewSummary.ts` — fetch-reviews → summarize-reviews 체인
- `src/hooks/useReviews.ts` — 사용자 리뷰 (Phase 19 잔존)
- `src/hooks/useFavorites.ts`, `useHistory.ts`, `useMenus.ts`, etc.

### 컴포넌트
- `src/components/RealMapView.native.tsx` / `.web.tsx` / `.d.ts`
- `src/components/ReviewSummaryView.tsx` — 자동 요약 표시 UI
- `src/components/MenuSection.tsx`, `ReviewCard.tsx`, `RestaurantCard.tsx`

### 하네스
- `harness/validators/*.py` — 18개 validator
- `harness/validators/run_all.py` — 정상 케이스 테스트
- `harness/validators/test_fail_cases.py` — 실패 케이스 테스트
- `harness/scripts/import-meta-safe-transformer.js` — Metro transformer (필수)

### 문서
- `CLAUDE.md` — 절대 규칙
- `research.md` — 작업 누적 기록 (필수, 새 작업 시 append)
- `search.md` — 검증 로그 (외부 API 응답 샘플 포함)
- `docs/handoff.md` — 이 문서
- `docs/architecture.md`, `docs/ADR.md`

---

## 9. 실행/테스트 명령

```bash
# 의존성
npm install

# 웹 개발 서버 (가장 빠른 검증 경로)
npm run web

# 자동 검증 (TS + 18 validators + 7 fail-cases)
npm run check

# 개별
npm run typecheck
npm run validate
npm run validate:fail

# iOS / Android 개발 빌드 (네이티브 지도 SDK 활성화)
npx expo prebuild --clean
npm run ios
npm run android

# Edge Function 배포 (Docker 불필요 — npx supabase 사용)
npm run deploy:fn          # search-restaurant만
npm run deploy:fn:reviews  # fetch + summarize
npm run deploy:fn:all      # 전부

# Edge Function 직접 호출 검증 (curl)
curl -X POST https://hvucxypkwezwquejhlzg.supabase.co/functions/v1/search-restaurant \
  -H 'Content-Type: application/json' \
  -d '{"query":"성수동 카페","region":"KR","limit":10}'
```

---

## 10. 알려진 문제/리스크

### 알려진 문제
1. **로그인 게이트** — Supabase "Confirm email" 기본 ON이라 로그인 안 됨
   - 해결: 사용자가 Dashboard에서 OFF 토글 (1분)
2. **캐시 미적용** — migrations/005 실행 전엔 매번 Claude 호출
   - 해결: 사용자가 SQL Editor에서 실행 (1분)
3. **Playwright 자동화 불안정** — 사용자 Chrome과 잠금 충돌
   - 우회: curl로 Edge Function 직접 호출 검증
4. **fetch-reviews 캐시 없음** — 같은 음식점 100명이 5분 내 조회하면 Naver API 100회 호출
   - 우선순위 P1으로 fetch-reviews TTL 캐시 추가 권장

### 리스크
1. **Naver API 일일 쿼터** — 무료 25,000건/일. 캐시 적용 후 안전
2. **Anthropic API 비용** — 캐시 적용으로 90%+ 절감 예상. 트래픽 폭증 시 모니터링 필요
3. **Naver Local API display=5 제한** — 회피 방법 없음 (start>1 미지원 확인). 병렬 다중 호출로 보완 중
4. **expo-router SSG 미사용** — `web.output: "single"` SPA로 강제 → SEO 약함. 음식점 페이지를 검색엔진 노출하려면 별도 SSR 인프라 필요
5. **사용자 리뷰 코드 잔존** — 미래에 "내 메모" 부활 결정 시 UI 복원만 하면 되지만, 그때까지 코드 부담
6. **지도 키 누락** — 사용자가 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 등 안 넣으면 빈 지도. graceful degradation으로 grid fallback 표시 중

---

## 11. 다음에 해야 할 작업 3개

### Top 1: 캐시 동작 end-to-end 검증 (사용자가 SQL 실행한 직후)
```
1. 사용자에게 SQL 실행 여부 확인
2. curl로 같은 음식점 2회 summarize-reviews 호출
3. 1차: X-Cache 헤더 없음, 응답 시간 ~1500ms (Claude 호출)
4. 2차: X-Cache: HIT, 응답 시간 ~100ms (DB만 조회)
5. Supabase Dashboard에서 review_summary_cache 행 확인 (hit_count 증가 확인)
6. search.md에 검증 결과 append + commit
```

### Top 2: fetch-reviews TTL 캐시 추가 (P1, 사용자 추가 작업 불필요)
```
1. _shared/cache.ts에 readReviewsCache / writeReviewsCache 추가 (TTL 1h)
2. migrations/006_add_reviews_cache.sql 작성 (search_cache 패턴 그대로)
3. fetch-reviews/index.ts에 캐시 wire-in
4. 배포 + 검증 (같은 음식점 1시간 내 재조회 시 Naver API 0회)
5. 효과: 트래픽 폭증 시 Naver API 쿼터 보호
```

### Top 3: 지도 탭 사용자 위치 자동 중심
```
1. expo-location 권한 요청 (이미 plugin 추가됨)
2. useLocation hook 신규 (위치 권한 + 현재 좌표 반환)
3. map.tsx에서 검색 결과 없을 때 사용자 좌표를 RealMapView center로 전달
4. RealMapView.native.tsx의 NaverMapBranch / GoogleMapBranch camera 초기값에 추가
5. 권한 거부 시 fallback (서울시청 좌표 기본)
6. iOS infoPlist + Android permissions 이미 설정됨 (app.config.js)
```

---

## 12. 사용자에게 물어봐야 하는 결정사항

### A. 마이그레이션 005 실행 여부 확인 (즉시)
- "Supabase SQL Editor에서 `supabase/migrations/005_add_edge_function_cache.sql` 실행하셨나요?"
- 미실행이면 캐시 동작 안 함 → 위 Top 1 작업 보류

### B. Supabase Email Confirm 설정 (즉시)
- "Authentication > Providers > Email > Confirm email 토글 OFF 하셨나요?"
- 안 했으면 로그인 안 됨 → 웹 UI 직접 검증 불가

### C. 디자인 변경 의향
- "Figma 디자인 있으세요? URL/파일 주시면 cozyTheme 위에 새 디자인 시스템 적용 가능"
- "없으면 현재 cozyTheme 유지하고 기능 개발 계속"

### D. 모바일 빌드 우선순위
- "지금 모바일 앱 (iOS/Android) 빌드 시급한가요?"
- 시급 → 지도 SDK 키 3개 발급 안내 + prebuild 실행 가이드
- 나중 → 웹에서 검증/개선만 계속

### E. 추가 데이터 소스
- "리뷰 수집 출처 더 늘릴까요?"
  - 카카오맵 (KR, API 키 필요)
  - 망고플레이트 (KR, 약관 검토 필요)
  - 인스타그램 (글로벌, 비공식)
- 현재: 네이버 블로그 + 카페 (KR), 구글 리뷰 5건 (GLOBAL)

### F. 배포 인프라
- "프로덕션 배포 계획 있나요?"
  - 웹: Vercel / Cloudflare Pages / GitHub Pages?
  - iOS: TestFlight → App Store?
  - Android: 내부 테스트 → Play Store?
- 결정에 따라 EAS Build 설정 / CI/CD 파이프라인 구성

### G. 향후 기능 우선순위
- "다음 중 어느 것 먼저 만들까요?"
  1. 지도 마커 클러스터링 (가까운 음식점 묶기)
  2. 음식점 상세 페이지 공유 (deep link)
  3. PWA manifest (홈 화면 추가)
  4. 다크모드
  5. 사용자 메모 기능 ("내 메모" 부활 — Phase 19 UI 복원)
  6. 가까운 음식점 추천 (위치 기반)

---

## 부록: 환경 정보

```
Node.js v25.8.2
Expo SDK 54.0.34
React Native 0.81.5
TypeScript 5.9.2
Supabase project: hvucxypkwezwquejhlzg
GitHub: https://github.com/tjwnstjq97-cloud/food-harness-app
브랜치: main
최신 커밋: 6380381 (feat: Postgres 캐시 도입)
```

**Anthropic 모델**: claude-haiku-4-5 (summarize-reviews 내부)
**Edge Function 배포 상태**: search-restaurant, fetch-reviews, summarize-reviews (모두 최신)
**Secrets 등록 상태**: NAVER_SEARCH_CLIENT_ID/SECRET, GOOGLE_MAPS_API_KEY, ANTHROPIC_API_KEY (검증 완료)

---

이 문서로 다음 에이전트가 0에서부터 컨텍스트를 다시 잡지 않고 바로 작업 이어갈 수 있어야 합니다. 추가 컨텍스트는 `search.md`(검증 로그) 와 `research.md`(작업 누적 기록) 참고.
