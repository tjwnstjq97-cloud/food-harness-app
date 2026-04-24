# Handoff

> Last updated: 2026-04-25

이 문서는 다른 환경이나 다른 에이전트에서 바로 이어서 작업하기 위한 인수인계 메모입니다.

## Repository

- GitHub: https://github.com/tjwnstjq97-cloud/food-harness-app
- Visibility: public
- Main branch: `main`
- Latest pushed commit at handoff: check `git log --oneline -5`

## Current State

- Expo / React Native / TypeScript 앱
- Supabase Auth, PostgreSQL, RLS, Edge Function 사용
- KR / GLOBAL 지역 분기
- 검색, 상세, 즐겨찾기, 프로필/방문기록, 지도 placeholder 구현
- 리뷰 장점/아쉬운 점 키워드 칩 구현 (부정 12종, 긍정 12종 — Phase 18)
- 사용자 직접 리뷰 작성/수정/삭제 (Phase 19, source='user' + RLS)
- 검색/즐겨찾기/지도 FlatList 성능 튜닝 + RestaurantCard/ReviewCard memo (Phase 23)
- a11y 라벨/role 적용 (RestaurantCard, ReviewSubmitForm)
- 홈 첫 화면에 cozy discovery banner 적용
- Cozy design tokens added in `src/utils/theme.ts`
- Home screen, search bar, and region badge partially restyled with cozy palette
- Restaurant detail page partially restyled with cozy dashboard layout
- Splash/adaptive icon background: `#F7F1E7`
- GitHub Actions check workflow added

## Verification

항상 작업 전후로 아래 명령을 실행합니다.

```bash
npm run check
```

현재 마지막 확인 결과:

- TypeScript: pass
- Python validators: 18 pass (Phase 19, 27 추가: user_review_ownership, no_oneline_summary)
- Fail-case tests: 7 pass (negative regressions for 5 validators + 임시 디렉터리 패턴 검출)

## Important Files

- App entry/layout: `app/_layout.tsx`
- Home/search screen: `app/(tabs)/index.tsx`
- Detail screen: `app/restaurant/[id].tsx`
- Favorites screen: `app/(tabs)/favorites.tsx`
- Profile/history screen: `app/(tabs)/profile.tsx`
- Search hook: `src/hooks/useSearch.ts`
- Review hook/highlights: `src/hooks/useReviews.ts`
- Review submit hook: `src/hooks/useSubmitReview.ts` (Phase 19)
- Review submit form: `src/components/ReviewSubmitForm.tsx` (Phase 19)
- Map links: `src/utils/mapLink.ts`
- Supabase client: `src/lib/supabase.ts`
- Banner asset: `assets/images/discovery-banner.png`
- Supabase migrations: `supabase/migrations/` (001~004)
- Seed data: `supabase/seed/`
- Validators: `harness/validators/` (18 validators)

## Recent Work Log

### User Reviews (Phase 19, 2026-04-25)

- New migration: `supabase/migrations/004_add_user_reviews.sql`
  - Added `reviews.user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
  - Added `UNIQUE(user_id, restaurant_id)` — 한 사용자가 한 음식점에 1개 리뷰만
  - Added INSERT/UPDATE/DELETE RLS policies (own rows only, source must be 'user')
  - 기존 외부 리뷰(user_id IS NULL)는 영향 없음
- New hook: `src/hooks/useSubmitReview.ts`
  - submit / update / remove mutations
  - rating 4.0+ → positive / 2.5- → negative / 그 외 neutral 자동 분류
  - 23505 (UNIQUE 위반) → 친절한 안내 메시지
- New component: `src/components/ReviewSubmitForm.tsx`
  - rating 별 5개 탭, 5~500자 멀티라인 입력
  - 로컬 검증 + 에러 박스 + 글자수 카운터
  - a11y label/role 적용
- Updated `src/components/ReviewCard.tsx`:
  - "내 리뷰" 배지 + 카드 색 강조
  - onEdit/onDelete props (isMine일 때만 활성)
- Updated `app/restaurant/[id].tsx`:
  - "+ 내 리뷰 작성" 버튼 (이미 작성한 경우 숨김)
  - 비로그인 사용자는 로그인 유도 카드
  - 수정/삭제 핸들러 (Alert 확인 → mutation → toast)
- Updated `src/types/review.ts`: `userId`, `isMine` 필드 추가
- Updated `src/hooks/useReviews.ts`:
  - user 컨텍스트 의존 → queryKey에 userId 추가
  - row.user_id 매핑 + isMine 자동 계산
- Updated seed: `supabase/seed/test_domain_data.sql` DELETE 절 — user_id IS NULL만 삭제 (사용자 리뷰 보존)

### Performance + a11y (Phase 23, 2026-04-25)

- `src/components/RestaurantCard.tsx`:
  - `React.memo` 래핑
  - card press / favorite toggle에 accessibilityRole + accessibilityLabel + accessibilityState
  - thumbnail은 accessible={false} (장식용)
- `src/components/ReviewCard.tsx`:
  - `React.memo` 래핑
  - edit/delete 버튼에 a11y label/role
- FlatList 튜닝:
  - `app/(tabs)/index.tsx`: initialNumToRender 8 / windowSize 11 / removeClippedSubviews
  - `app/(tabs)/favorites.tsx`: initialNumToRender 10 / windowSize 11
  - `app/(tabs)/map.tsx`: initialNumToRender 6 / windowSize 7

### Validator + Test 확장 (Phase 27, 2026-04-25)

- New: `harness/validators/review/user_review_ownership.py`
  - source='user'인데 user_id 없으면 실패
- New: `harness/validators/review/no_oneline_summary.py`
  - 코드베이스에서 oneLineSummary / summarizeReview / "한 줄 요약" 등 패턴 스캔
  - 사용자 명시 거절 항목 (handoff "Work To Avoid") 회귀 방지
  - SKIP_DIRS / SKIP_FILES로 오탐 차단
- New script: `npm run validate:fail` (`test_fail_cases.py`)
  - 6 fail-case + 1 임시 디렉터리 기반 통합 테스트
- `npm run check`이 typecheck → validate → validate:fail 순서로 실행

### Proposed Features 분리 (2026-04-24)

- 외부 의존(라이브러리 설치, API 키, 결제 계정 등) 작업을 `proposed_features.md`로 분리
- 우선순위 🔴/🟡/🟢/🔵 표시
- 13개 항목 + "🚫 거절 이력" 섹션 (재제안 방지)

### GitHub Setup

- Installed GitHub CLI.
- Authenticated as `tjwnstjq97-cloud`.
- Public repo configured at `origin`.
- Pushed `main`.

### README and Scripts

- Added `README.md`.
- Added scripts in `package.json`:
  - `typecheck`
  - `validate`
  - `check`

### Map Hook Cleanup

- Updated `src/hooks/useMap.ts`.
- Removed old `search-naver` / `search-google` references.
- Aligned with the actual unified Edge Function: `search-restaurant`.

### Review Highlights

- Updated `src/hooks/useReviews.ts`.
- Builds keyword highlights from valid sourced reviews.
- Positive examples: `맛`, `국물`, `가성비`, `친절`, `신선도`.
- Negative examples: `긴 대기`, `높은 가격`, `적은 양`, `평범함`.
- Updated detail page to show `장점` and `아쉬운 점` chips.

### Negative Keywords Expanded (Phase 18, 2026-04-24)

- Updated `src/hooks/useReviews.ts` `NEGATIVE_KEYWORDS` rules.
- Added 7 new negative categories per user request:
  - `불친절` — 무례, 버릇없, 태도, rude, attitude
  - `흡연` — 담배, 흡연, 담배 냄새, smoke, smoking
  - `서빙 지연` — 늦게 나오, 음식이 늦, 한참 만에, slow service
  - `냄새` — 냄새가, 악취, 비위, 쩐내, smelly, stink
  - `차별` — 차별, 인종차별, 외국인 차별, racist, discriminat
  - `위생` — 더럽, 청결, 벌레, 머리카락, dirty, hygiene, unsanitary
  - `시끄러움` — 시끄러, 소음, 떠들, noisy, loud
- Existing 5 categories tightened to avoid false positives
  (e.g., `예약 필요` no longer matches generic `예약`).
- Added matching seed reviews to `supabase/seed/test_domain_data.sql`
  for `test_kr_001`, `test_kr_002`, `test_kr_003`, `test_gl_001`.
- No UI changes needed — detail page chip section auto-renders new keywords.
- User must re-run `supabase/seed/test_domain_data.sql` to see new chips.
- Rule: still no LLM-based one-line summary (handoff "Work To Avoid" honored).

### Discovery Banner

- Generated a warm globe/speech-bubble banner.
- Committed selected asset as `assets/images/discovery-banner.png`.
- Applied it to the home empty state / first search screen.
- Changed app splash/adaptive icon background to warm ivory.
- Optimized the committed banner from about 2 MB to about 1 MB.

### Cozy Theme Pass

- Added `src/utils/theme.ts`.
- Started centralizing colors for warm ivory, sage, clay orange, charcoal, positive, and negative chips.
- Applied the new palette to:
  - `app/(tabs)/index.tsx`
  - `app/restaurant/[id].tsx`
  - `src/components/SearchBar.tsx`
  - `src/components/RegionBadge.tsx`
  - `src/components/MenuSection.tsx`

### Detail Page Cozy Pass

- Reworked top section of `app/restaurant/[id].tsx`.
- Added:
  - soft eyebrow label
  - compact action row (`지도`, `전화`, `예약`, `공유`)
  - 4-cell decision dashboard (`평점`, `웨이팅`, `예약`, `리뷰 분위기`)
- Kept existing behaviors:
  - favorites toggle
  - share
  - phone
  - reservation link/phone
  - waiting details
  - review cards and expand/collapse
- This is a partial redesign pass, not the final full polish.

### Search Result Card Meta Pass

- Added `src/hooks/useRestaurantCardMeta.ts`.
- Search result cards in `app/(tabs)/index.tsx` now load batched meta by restaurant ids.
- Card-level additions:
  - rating + review count
  - waiting label
  - reservation status label
  - representative menu preview
- If domain data is missing, cards gracefully fall back to the original lighter layout.

### Map Tab UI Skeleton Pass

- Replaced the old placeholder `app/(tabs)/map.tsx`.
- Map tab now includes:
  - search bar
  - quick search chips
  - recent search shortcuts
  - faux map canvas with marker dots
  - selected place preview card
  - result list
  - detail page navigation
- This is still a non-SDK map implementation.
- Real Naver / Google map SDK integration is still pending.

### CI

- Added `.github/workflows/check.yml`.
- Runs `npm ci` and `npm run check` on push/PR to `main`.

### Design Exploration

Preferred concept:

- Name: `Cozy Map Insight`
- Direction: warm Korean restaurant app + map discovery + review insights
- Palette direction:
  - Warm ivory background
  - Muted sage for KR accents
  - Softer blue for GLOBAL accents
  - Clay orange for primary actions
  - Olive green for positive chips
  - Dusty rose/red for negative chips

Generated mockups/images:

- Several preview images exist under `/Users/seojunseop/.codex/generated_images/...`.
- Only `assets/images/discovery-banner.png` is committed.
- A newer "less AI-looking" banner preview was generated after the committed one, but it has not been selected, copied into the project, or committed yet.
- User asked to avoid committing new creative-direction choices without review. Leave candidate creative assets as recommendations until selected.

## Copyright / Asset Notes

- The committed banner is AI-generated from an original prompt.
- It uses generic elements: globe, speech bubbles, question/exclamation symbols, heart, utensils, map pin.
- It does not intentionally copy a specific brand, character, logo, or known app style.
- It should be low risk for internal app banner/onboarding usage.
- For final brand identity, app icon, trademark usage, or App Store-level branding, create a simplified custom mark or have a designer refine/vectorize it.

## Supabase Assumptions

The user said app runtime checks are done and Supabase project setup is already applied.

Expected SQL order:

```text
supabase/migrations/001_create_tables.sql
supabase/migrations/002_add_profiles_and_restaurants.sql
supabase/migrations/003_add_domain_tables.sql
supabase/migrations/004_add_user_reviews.sql      # Phase 19 — 사용자 리뷰 user_id + RLS
supabase/seed/test_restaurants.sql
supabase/seed/test_domain_data.sql                # 004 적용 후 재실행 권장
```

Expected Edge Function:

```bash
npm run deploy:fn
```

## Near-Term Work Queue

Recommended next order:

1. Continue restaurant detail page polish using `Cozy Map Insight`.
   - Review card tone, external links, section density, header finish.
2. Continue search result card polish.
   - Better chip color rules, global/local nuance, spacing, optional icon actions.
3. Continue map tab polish.
   - better marker behavior, richer result cells, eventual handoff to real SDK.
4. Continue replacing hard-coded colors with `src/utils/theme.ts`.
5. Add README screenshots or app screenshots after user approves visual direction.
6. Review the less AI-looking banner candidate and decide whether to replace the committed banner.

## Recommendations Waiting For User Decision

- Whether to replace `assets/images/discovery-banner.png` with the newer less-AI-looking banner candidate.
- Whether app icon/splash should use the globe/speech-bubble motif or a simpler custom mark.
- Exact final detail-page visual density before a full redesign pass.

## Work To Avoid For Now

- Do not add a separate "one-line review summary"; user explicitly removed it.
- Do not add a separate "menu recommendation" feature; menu/representative menu already covers it.
- Do not overcomplicate the banner with too many symbols or decorative clutter.
- Do not commit `.env`, `.expo`, `ios/`, `node_modules/`, or generated defaults outside selected assets.
