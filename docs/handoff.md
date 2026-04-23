# Handoff

> Last updated: 2026-04-23

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
- 리뷰 장점/아쉬운 점 키워드 칩 구현
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
- Python validators: 16 pass

## Important Files

- App entry/layout: `app/_layout.tsx`
- Home/search screen: `app/(tabs)/index.tsx`
- Detail screen: `app/restaurant/[id].tsx`
- Favorites screen: `app/(tabs)/favorites.tsx`
- Profile/history screen: `app/(tabs)/profile.tsx`
- Search hook: `src/hooks/useSearch.ts`
- Review hook/highlights: `src/hooks/useReviews.ts`
- Map links: `src/utils/mapLink.ts`
- Supabase client: `src/lib/supabase.ts`
- Banner asset: `assets/images/discovery-banner.png`
- Supabase migrations: `supabase/migrations/`
- Seed data: `supabase/seed/`
- Validators: `harness/validators/`

## Recent Work Log

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
supabase/seed/test_restaurants.sql
supabase/seed/test_domain_data.sql
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
