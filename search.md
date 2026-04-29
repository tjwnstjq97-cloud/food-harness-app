# Search / Verification Log

엔드 투 엔드 동작 검증 로그. 각 작업이 코드만 통과하는 게 아니라 실제 외부 API + UI까지 동작하는지를 기록.

---

## 2026-04-29 — Phase 21+ Web 검증 (Playwright + 실제 Edge Function 호출)

### 1. 웹 빌드 부팅 검증

**문제 1: SSG 정적 렌더 시 `window is not defined`**
- 원인: `app.config.js` 의 `web.output: "static"` → expo-router가 server-side에서 page 사전 렌더 시도
- AsyncStorage가 server context에서 `window.localStorage` 접근하다 크래시
- 해결: `web.output: "single"` (SPA 모드)로 변경 → 클라이언트 전용 렌더

**문제 2: `Cannot use 'import.meta' outside a module`**
- 원인: zustand v5의 devtools 미들웨어가 `import.meta.env` 참조 (ESM 가정)
- Expo Web은 bundle을 `<script>` (not `<script type="module">`)로 로드 → SyntaxError로 앱 전체 빈 화면
- 시도 1: `babel-plugin-transform-import-meta` overrides — node_modules에 babel transform이 적용 안 됨 (Expo 기본 동작) → 실패
- 시도 2: Expo 54.0.33 → 54.0.34 패치 업그레이드 — 무관 → 실패
- 해결: Metro `babelTransformerPath` 를 wrapper 로 교체 (`harness/scripts/import-meta-safe-transformer.js`)
  - `platform === "web"` + `node_modules` 경로일 때만 source string 에 RegExp 치환
  - `import.meta.env` → `({MODE:"development",DEV:true,PROD:false})`
  - `import.meta.url` → `location.href`
  - 잔여 `import.meta` → `({})`
- 결과: bundle 178746 lines, `import.meta.x` 잔여 0건, 웹 부팅 성공

### 2. 라우팅 / 온보딩 / 인증 화면 검증 (Playwright)

| 단계 | URL | 결과 |
|---|---|---|
| 첫 진입 | `/` → `/region` 자동 이동 | ✅ (zustand persist 미초기화 상태 감지) |
| 지역 선택 | KR 라디오 클릭 → 선택 표시 ✓ | ✅ |
| 시작하기 | `/login` 자동 이동 | ✅ |
| 회원가입 | `/register` 폼 정상 표시 + 비밀번호 강도 표시 ("강함") | ✅ |
| 회원가입 POST | `https://...supabase.co/auth/v1/signup` → 200 | ✅ |
| 로그인 시도 | 400 — Supabase 이메일 확인 필수 (프로젝트 설정) | ⚠️ 사용자 액션 필요 |

⚠️ 로그인 게이트는 Supabase 프로젝트의 "Confirm email" 설정 때문. 사용자가 dashboard에서:
- Authentication → Providers → Email → "Confirm email" OFF
- 또는 등록 메일의 confirm 링크 클릭

### 3. Edge Function 3종 실제 동작 검증 (브라우저에서 직접 fetch)

#### 3-1. search-restaurant (KR 카테고리 화이트리스트 + 부스트)

```
POST /functions/v1/search-restaurant
{ "query": "성수동 카페", "region": "KR", "limit": 5 }
→ 200
{
  "restaurants": [
    { "name": "블루보틀 성수 카페", "category": "음식점>카페,디저트", ... },
    { "name": "아쿠아산타 성수카페", "category": "음식점>카페,디저트", ... },
    { "name": "어니언 성수", "category": "음식점>카페,디저트", ... },
    ...
  ]
}
```
✅ 모든 결과가 음식점 카테고리. 다이소 같은 비음식점 0건.

#### 3-2. fetch-reviews (네이버 블로그)

```
POST /functions/v1/fetch-reviews
{ "restaurantName": "블루보틀 성수", "region": "KR", "limit": 5 }
→ 200, 5건
sample: "블루보틀 성수 뚝섬역 근처 커피 맛집 주차와 방문 후기 ..."
sourceUrl: "https://blog.naver.com/doremisol955/224156943074"
```
✅ HTML 태그 제거, sourceUrl 보존, source="naver_blog" 정확히 부착.

#### 3-3. summarize-reviews (Claude Haiku 4.5)

```
POST /functions/v1/summarize-reviews
{ "restaurantName": "어니언 성수", "reviews": [ ...8건 ] }
→ 200
{
  "positivePoints": [
    "야외석, 루프탑 등 다양한 공간",
    "성수역 접근성 좋음",
    "성수 인기 핫플레이스",
    "베이글, 케이크 등 베이커리 추천",
    "여러 지점 운영 (안국, 미아 등)"
  ],
  "negativePoints": [ "주차 불편 (유료 필요)" ],
  "totalReviewCount": 8,
  "sources": [{ "type": "naver_blog", "count": 8, "urls": [5개 url] }],
  "generatedAt": "..."
}
```
✅ Claude 응답 품질 우수:
- 모든 포인트 한국어, 한 줄, 사실 기반
- 추측 없음 (실제 블로그 후기에 명시된 정보만)
- 부정 포인트 정확히 추출 ("주차 불편")
- sources attribution validator 통과 (count > 0, urls 채워짐)

### 4. 자동 검증 (npm run check)

| 검사 | 결과 |
|---|---|
| TypeScript | 0 errors (RealMapView.d.ts 추가 후) |
| Validators (`npm run validate`) | 18/18 PASS |
| Fail cases (`npm run validate:fail`) | 7/7 detected |

### 5. Figma 통합 준비

- `figma/mcp-server-guide@implement-design` (5.9K installs) 설치 ✅
- `figma/mcp-server-guide@figma-use` (1.9K installs) 설치 ✅
- `figma/mcp-server-guide@create-design-system-rules` (1.3K installs) 설치 ✅
- 사용 방법: Figma 데스크톱 앱의 dev mode → MCP server 활성화 → URL 공유하면 디자인 토큰 추출 가능

### 6. 검증 환경 (재현용)

```
Node.js v25.8.2
expo 54.0.34
metro custom transformer: harness/scripts/import-meta-safe-transformer.js
babel: ["react-native-worklets/plugin"] (import-meta는 metro 단계로 이동)
Web URL: http://localhost:8081
Supabase project: hvucxypkwezwquejhlzg
배포된 Edge Functions: search-restaurant, fetch-reviews, summarize-reviews
```

### 7. 남은 사용자 액션

1. **Supabase Email Confirm OFF** (검증용) 또는 confirm 메일 클릭 → 로그인 후 상세 페이지/지도 직접 확인
2. **(선택) ANTHROPIC_API_KEY 등록 확인** — 위 summarize-reviews 200 응답으로 이미 등록 확인됨 ✅
3. **iOS/Android 빌드** — `npx expo prebuild --clean && npm run ios` (네이티브 지도 SDK 활성화)
4. **지도 SDK 키 .env 입력** — EXPO_PUBLIC_NAVER_MAP_CLIENT_ID, EXPO_PUBLIC_GOOGLE_MAPS_*

---

## 검증 결론

**제품 본질 (외부 리뷰 자동 수집 → AI 요약) 가 백엔드에서 완전히 동작함을 객관적으로 확인.**

- 네이버 검색 + 블로그 API → 실제 음식점만 필터링 + 실제 후기 수집 ✅
- Anthropic Claude API → 한국어 긍정/부정 포인트 추출 + 출처 첨부 ✅
- 하네스 규칙 (sources 필수) 준수 ✅
- Web/iOS/Android 셋 중 Web 으로 검증 (Playwright 자동화 가능한 유일한 타겟)
- iOS/Android는 사용자가 prebuild 후 동일한 Edge Function 호출 → UI 컴포넌트는 TypeScript 타입 체크 통과

---

## 2026-04-29 (오후) — 리뷰 갯수 부족 + UI 순서 개선

### 사용자 피드백
- "리뷰요약을 총합본 밑으로 옮겨주고"
- "리뷰 갯수가 부족한거같은데 어디서 구해온거지 좀더 리뷰가 많을텐데"

### 진단
- 기존: fetch-reviews는 `naver/v1/search/blog.json` 한 곳만 호출, `useReviewSummary` 기본 limit=10
- 결과: 어니언 성수 8건만 수집 → Claude가 표면적 요약 (긍정 5/부정 1)

### 수정
1. **상세 페이지 섹션 순서 변경** (`app/restaurant/[id].tsx`)
   - 이전: 한눈에보기 → 메뉴 → 예약 → 웨이팅 → 외부링크 → **리뷰요약** (마지막)
   - 신규: 한눈에보기 → **리뷰요약** → 메뉴 → 예약 → 웨이팅 → 외부링크

2. **fetch-reviews에 네이버 카페 검색 추가** (`supabase/functions/fetch-reviews/index.ts`)
   - 신규 함수 `fetchNaverCafe()` — `/v1/search/cafearticle.json` 호출
   - 같은 NAVER_SEARCH_CLIENT_ID/SECRET 재사용 (별도 키 등록 불필요)
   - 블로그 60% / 카페 40% 비율로 limit 분할
   - `Promise.allSettled`로 병렬 호출 + 한쪽 실패해도 다른쪽 결과 사용
   - sourceUrl 기준 dedupe (동일 글 중복 방지)

3. **useReviewSummary 기본 limit 10 → 25** (`src/hooks/useReviewSummary.ts`)

4. **UI 라벨 추가** (`src/types/review.ts`)
   - `naver_cafe` → "네이버 카페" 칩

### 검증 (재배포 후 어니언 성수 동일 음식점)

```
POST /functions/v1/fetch-reviews
{ "restaurantName": "어니언 성수", "region": "KR", "limit": 25 }
→ 200, 25건 (naver_blog 15 + naver_cafe 10)
sample cafe URL: http://cafe.naver.com/ps2power/633792
sample blog URL: https://blog.naver.com/plesure1014/224058903261
```

```
POST /functions/v1/summarize-reviews (위 25건)
→ 200
positivePoints: [
  "다양한 베이커리 종류",
  "맛있는 빵과 디저트",
  "성수역 접근성 좋음",
  "공장감성 독특한 인테리어",  ← 카페 후기에서 새로 추출
  "아침 일찍 오픈"               ← 카페 후기에서 새로 추출
]
negativePoints: [
  "주차가 어려움",
  "주말 대기시간 길음",          ← 카페 후기에서 새로 추출
  "입구 진입이 어려움"           ← 카페 후기에서 새로 추출
]
totalReviewCount: 25
sources: [{ naver_blog: 15 }, { naver_cafe: 10 }]
```

✅ 부정 포인트 1건 → 3건으로 증가, 더 구체적인 정보(주말 대기, 입구 진입) 발견
✅ Claude 응답 품질 안정적, 한국어 한 줄, 사실 기반
✅ TypeScript 0 errors / 18 validators PASS / 7 fail-cases detect

### 추가 확장 가능 옵션 (필요 시)
- limit 25 → 50까지 안전 (Naver display max 30 per endpoint, 두 곳 합산 60)
- `/v1/search/kin.json` (지식인) — 후기 품질 낮아서 제외 (추천 X)
- 카카오맵 / 망고플레이트 API — 별도 키 + 약관 검토 필요
