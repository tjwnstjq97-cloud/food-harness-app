# Handoff

> Last updated: 2026-04-23

이 문서는 다른 환경이나 다른 에이전트에서 바로 이어서 작업하기 위한 인수인계 메모입니다.

## Repository

- GitHub: https://github.com/tjwnstjq97-cloud/food-harness-app
- Visibility: public
- Main branch: `main`
- Latest pushed commit at handoff: `fdba0d2 Add cozy discovery banner`

## Current State

- Expo / React Native / TypeScript 앱
- Supabase Auth, PostgreSQL, RLS, Edge Function 사용
- KR / GLOBAL 지역 분기
- 검색, 상세, 즐겨찾기, 프로필/방문기록, 지도 placeholder 구현
- 리뷰 장점/아쉬운 점 키워드 칩 구현
- 홈 첫 화면에 cozy discovery banner 적용
- Splash/adaptive icon background: `#F7F1E7`

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

1. Optimize or replace `assets/images/discovery-banner.png`.
   - Current file is about 2 MB.
   - User wants a less AI-looking, more normal app-style illustration.
2. Add shared theme tokens.
   - Create a central palette for ivory/sage/clay/charcoal.
   - Replace repeated hard-coded colors gradually.
3. Restyle home screen to match the cozy banner.
   - Background, search area, chips, recent search section.
4. Redesign restaurant detail page using `Cozy Map Insight`.
   - Header, action bar, decision dashboard, review chips, menu preview.
5. Enhance search result cards.
   - Rating, review count, representative menu, waiting, reservation status.
6. Add GitHub Actions CI.
   - Run `npm run check` on push/PR.
7. Prepare map tab real UI.
   - SDK can come later; first build map-like layout and result handoff.

## Work To Avoid For Now

- Do not add a separate "one-line review summary"; user explicitly removed it.
- Do not add a separate "menu recommendation" feature; menu/representative menu already covers it.
- Do not overcomplicate the banner with too many symbols or decorative clutter.
- Do not commit `.env`, `.expo`, `ios/`, `node_modules/`, or generated defaults outside selected assets.

