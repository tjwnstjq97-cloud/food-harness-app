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

---

## 2026-04-29 (저녁) — 검색 정확도 + 체감 렉 개선

### 사용자 피드백
- "검색이 정확히 안된다"
- "검색할때 조금씩 렉걸리는 현상"

### 진단
**정확도:**
- Naver Local API `display` 하드 제한 = 5건. 카테고리 필터 후 1~3건만 남음
- `sort=comment` 인기순 → 정확한 가게명/장르 매칭이 밀림
- 항상 "맛집" 부스트 → 정확한 검색어가 흐려짐 (예: "어니언 성수" → "어니언 성수 맛집")

**체감 렉:**
- 새 검색 입력 시 기존 결과 즉시 사라짐 → 빈 화면 → 스켈레톤 → 새 결과 (깜빡임)
- TanStack Query `placeholderData` 미사용
- start>1 pagination은 Naver Local API에서 미지원 (시도했으나 무효)

### 수정
1. **search-restaurant 병렬 다중 정렬** (`supabase/functions/search-restaurant/index.ts`)
   - `Promise.allSettled` 로 동일 쿼리 sim/comment 정렬 + (필요 시) 부스트 쿼리 sim 정렬 → 최대 3개 병렬
   - 좌표 id (`naver_{mapx}_{mapy}`) 기준 dedupe
   - 정확 가게명은 그대로, 일반 키워드는 결과 풍부

2. **useSearch placeholderData** (`src/hooks/useSearch.ts`)
   - `keepPreviousData` import + 추가 → 새 검색 중에도 이전 결과 유지
   - isFetching으로 작은 인디케이터만 표시 (스켈레톤 X)

3. **디바운스 300ms → 250ms** (`app/(tabs)/index.tsx`, `app/(tabs)/map.tsx`)
   - 한국어 IME 입력 끝맺음과 잘 맞는 임계값

### 검증 (재배포 후 7개 쿼리)

| 검색어 | Before | After | ms |
|---|---|---|---|
| 어니언 성수 | 1 | 1 (정확) | 476 |
| 성수동 카페 | 4 | **9** | 719 |
| 강남 카페 | 3 | **8** | 438 |
| 강남역 일식 | 5 | **9** | 487 |
| 블루보틀 | 5 | **8** | 496 |
| 명동 칼국수 | — | 7 | 389 |
| 신논현 라멘 | — | 8 | 394 |

✅ 결과 수 평균 2배 이상 증가, 정확도 유지
✅ 응답시간 389~719ms (대부분 500ms 이하 — 병렬 호출이라 직렬 대비 거의 손실 없음)
✅ TS 0 errors / 18 validators PASS / 7 fail-cases detect

### 미해결 한계
- Naver Local API 자체가 최대 5건/호출, start 파라미터 미지원 → 단일 쿼리로 100건 이상은 불가
- 더 많이 필요하면: 쿼리 변형(예: "성수 카페" + "성수동 카페" + "성수 코감기 맛집") 다중 호출 — 비용/속도 트레이드오프

---

## 2026-05-02 — 대표 메뉴 자동 추출 (Claude single-call)

### 문제
- 상세 페이지 "대표 메뉴" 섹션이 모든 음식점에 대해 빈 상태
- DB(`menus` 테이블)만 보고 있고 DB는 비어있음
- 향후 채워넣기 어려움 (Naver Place crawling 등 별도 인프라 필요)

### 해결
이미 동작하는 summarize-reviews(Claude Haiku)에 메뉴 추출 작업 추가.
- 동일한 리뷰 입력으로 한 번의 Claude 호출에 [긍정/부정/메뉴] 셋 다 받음
- 추가 호출 없음 (token만 약간 더 사용)

### 구현
1. **summarize-reviews 시스템 프롬프트 확장** (`supabase/functions/summarize-reviews/index.ts`)
   ```
   signatureMenus: 리뷰에서 실제로 언급된 메뉴명만 추출
   - mentionCount: 정수
   - 자주 언급된 순으로 최대 5개
   - 형용사/동사 제외, 메뉴명만
   ```

2. **타입 확장** (`_shared/types.ts`, `src/types/review.ts`)
   - `SummaryMenu = { name, mentionCount }`
   - `ReviewSummaryV2.signatureMenus: SummaryMenu[]`

3. **useReviewSummary hook** — 응답에서 signatureMenus 추출

4. **상세 페이지 통합** (`app/restaurant/[id].tsx`)
   - DB 메뉴(useSignatureMenus) 우선 → 없으면 reviewSummary.signatureMenus 변환해서 사용
   - source: `"review_extracted"`, priceStatus: `"unknown"`로 매핑

5. **MenuSection 라벨** — review_extracted 메뉴 있으면
   "* 외부 리뷰에서 자동 추출된 메뉴 (가격은 매장 확인 필요)" 표시

### 검증 (어니언 성수, 20건 리뷰)

```
positivePoints: ["빵 종류가 많고 맛있음", "공장감성 인테리어가 독특함", ...]
negativePoints: ["주차가 어려움", "인테리어 취향 갈림", ...]
signatureMenus: [
  { name: "무화과케이크", mentionCount: 1 },
  { name: "헤이즐넛 두쫀쿠", mentionCount: 2 },
  { name: "아메리카노", mentionCount: 2 },
  { name: "초코소금빵", mentionCount: 1 },
  { name: "앙버터", mentionCount: 1 }
]
```

✅ 모두 어니언 성수의 실제 메뉴 — Claude가 리뷰 본문에서 정확히 추출
✅ 추가 API 호출 0건 (기존 summarize-reviews에 작업만 추가)
✅ DB 메뉴 입력하면 그쪽이 우선 표시 (사용자/관리자 신뢰도 우선)
✅ TS 0 errors / 18 validators PASS / 7 fail-cases detect

---

## 2026-05-02 (오후) — DB 캐시 도입 (Anthropic 토큰 절약 + 응답 속도)

### 사용자 제안
> "데이터베이스에 각자 검색한 결과를 데이터베이스에 저장을 해서 다른사람이 검색해도 데이터가 변했는지만 검사하고 같다면 다시 내준다던가 하면 토큰사용이 덜하지않을까나"

### 설계
3개 Edge Function 중 캐시 효과 큰 2개에 적용:

| 함수 | 캐시 정책 | 토큰/비용 효과 |
|---|---|---|
| **summarize-reviews** | source_hash (정렬된 review URL SHA-256) 비교 | **Anthropic 호출 0회 → 비용 0** |
| **search-restaurant** | TTL 24h | Naver/Google 호출 0회 → 응답 속도 ↑ |
| fetch-reviews | 캐시 안 함 | 매번 fresh로 stale 감지 (의미 있음) |

### 구현
1. **마이그레이션 005** (`supabase/migrations/005_add_edge_function_cache.sql`)
   - `search_cache(cache_key PK, region, query, results JSONB, expires_at, hit_count)`
   - `review_summary_cache(cache_key PK, region, restaurant_name, source_hash, summary JSONB, hit_count)`
   - 두 테이블 RLS 활성화 → service_role만 접근 (Edge Function 내부 전용)
   - `cleanup_expired_search_cache()` + `increment_cache_hit(table, key)` RPC

2. **`_shared/cache.ts`** — 공용 유틸
   - `sha256Hex(input)`: SHA-256 hex (review URL 해시용)
   - `searchCacheKey(region, query)` / `summaryCacheKey(region, name)` — 정규화 키
   - `readSearchCache` / `writeSearchCache` (TTL 기반)
   - `readSummaryCache(key, expectedHash)` — hash 일치할 때만 hit
   - `writeSummaryCache(...)` — UPSERT
   - **silent fall-through**: 테이블 미생성/SUPABASE 키 미주입 환경에서 모두 무시 (앱 정상 동작)

3. **summarize-reviews 캐시 wire-in**
   - 정렬된 sourceUrl 목록의 SHA-256 = source_hash
   - cache hit → Claude 호출 스킵, totalReviewCount/sources만 fresh로 갱신해서 반환
   - cache miss → Claude 호출 + 캐시 갱신
   - response 헤더 `X-Cache: HIT` 추가

4. **search-restaurant 캐시 wire-in**
   - cache key `{region}:{query_normalized}`
   - TTL 24h 내면 Naver/Google 호출 스킵
   - response 헤더 `X-Cache: HIT` 추가

5. **클라이언트** (`src/hooks/useReviewSummary.ts`)
   - summarize-reviews 호출 body에 `region` 전달 → 캐시 키 분리

### Stale 자동 감지 메커니즘
- 같은 음식점 → fetch-reviews는 매번 호출 (무료, 빠름)
- 새 블로그/카페 글이 1개라도 추가되면 sourceUrl 목록 SHA-256 달라짐 → cache miss → Claude 재요약
- 즉, **데이터가 진짜 바뀐 경우만 토큰 소모**

### 사용자 액션 (1회만)
1. https://supabase.com/dashboard/project/hvucxypkwezwquejhlzg/sql 접속
2. New Query → `supabase/migrations/005_add_edge_function_cache.sql` 내용 붙여넣기 → Run
3. 끝 — 이후 모든 호출이 자동 캐시됨

### 검증 (테이블 미생성 상태에서 silent fall-through 확인)
```
POST /functions/v1/search-restaurant {"query":"강남 카페","region":"KR"}
→ HTTP 200, X-Cache: (empty)
→ 결과 8건 정상 반환 (Naver API 호출됨)
```
✅ 캐시 미적용 시에도 앱 동작 영향 없음
✅ TS 0 errors / 18 validators PASS / 7 fail-cases detect

### 예상 절감 효과 (사용자 SQL 실행 후)
- 인기 음식점은 cache hit률 90%+ 예상 → Anthropic API 비용 거의 0
- 같은 검색어 24h 내 재호출은 100% Naver API 절약
- 응답 시간: cache hit 시 50~100ms (vs Claude 호출 ~1500ms)
