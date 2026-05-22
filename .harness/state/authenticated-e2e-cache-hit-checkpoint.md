# Authenticated E2E / Cache HIT Checkpoint Package

This package is a pre-execution checklist. Do not run the authenticated or cache
steps until the user explicitly approves external Supabase/API access.

## Current Boundary

- Allowed now: local code review, local dry-run, `npm run check`, fixture/mock UI, browser rendering with `EXPO_NO_DOTENV=1`.
- Not allowed now: reading or printing `.env`, Supabase DB access, migration execution, Edge Function deploy, production/staging access, real external API calls.
- Codex should not receive or store passwords/API keys. Test credentials, if used, should be typed only into the local browser during an approved E2E session.

## Required Conditions Before Authenticated E2E

1. Supabase runtime configuration exists without Codex reading `.env`.
   - The app needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` at runtime.
   - If those values live in `.env`, the user must either start the server themselves or explicitly approve a safe runtime setup that does not print secrets.
2. Supabase session can be created.
   - Option A: a verified test account already exists.
   - Option B: Supabase Email Confirm is OFF, so signup returns a session immediately.
   - Option C: Email Confirm is ON, but the user completes email verification outside Codex before login validation.
3. The app pre-auth routes are stable.
   - `/login`, `/register`, and `/mock-search` render without console errors.
   - `/login` to `/register` repeated navigation keeps interactive DOM count stable.
4. User approves the authenticated browser run.
   - This approval covers login, real home search, opening a restaurant detail, and observing review fetch/AI summary boundaries.

## Required Conditions Before Cache HIT Validation

1. Migration 005 has been manually applied by the user.
   - Required file: `supabase/migrations/005_add_edge_function_cache.sql`.
   - Required objects:
     - `public.search_cache`
     - `public.review_summary_cache`
     - `public.increment_cache_hit(p_table TEXT, p_key TEXT)`
2. Edge Functions are deployed with the cache-aware code.
   - Functions:
     - `search-restaurant`
     - `fetch-reviews`
     - `summarize-reviews`
   - Cache headers expected:
     - `search-restaurant`: second identical request returns `X-Cache: HIT`.
     - `summarize-reviews`: second identical source-hash request returns `X-Cache: HIT`.
3. Edge Function secrets are configured in Supabase, not in client code.
   - Search may require Naver/Google provider secrets on first MISS.
   - Summary may require Anthropic secret on first MISS.
   - Codex must not read or print those secrets.
4. User approves either status inspection or redeploy if HIT fails.
   - Deployment command, approval-only: `npm run deploy:fn:all`.

## Local Preflight Only

Run before any real connection:

```bash
npm run auth-cache:preflight
npm run check
EXPO_NO_DOTENV=1 npm run web -- --port 8081
```

Browser checks while still offline/local:

- Open `/login`; confirm it renders with no console errors.
- Navigate `/login` to `/register` and back several times; interactive DOM count must not increase.
- Open `/mock-search`; reload several times; result card count, state section count, quick grid count, and console error count must remain stable.

## Authenticated E2E Procedure After Approval

1. Start the app with Supabase public runtime config available.
   - Do not print `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, or any credentials.
2. Open `/login`.
3. Sign in with an approved test account, or create a test account only if Email Confirm is OFF or verification is handled by the user.
4. Confirm authenticated redirect to the main tabs.
5. Run a deterministic search, for example:
   - KR: `성수 카페`
   - GLOBAL: `ramen`
6. Open the first restaurant detail.
7. Confirm the product flow:
   - Search results render.
   - Review fetch starts and degrades safely on partial failure.
   - AI summary renders only with source/evidence.
   - No source-less summary is displayed as fact.
   - `waitingSignal` appears only when label, evidence, and valid `sourceCount` exist.
   - Console error count stays 0.

## Cache HIT Validation Procedure After Approval

### A. Search Cache HIT

Send the same `search-restaurant` request twice with the same body.

Example request shape:

```json
{
  "query": "성수 카페",
  "region": "KR",
  "limit": 5
}
```

Expected result:

- First response: HTTP 200, normally MISS or no `X-Cache` header, valid restaurant response.
- Second response: HTTP 200 with `X-Cache: HIT`.
- Edge logs should include cache-hit wording such as `[cache] HIT search`.
- Optional DB inspection, approval-only: `search_cache.hit_count` increments for the normalized key.

### B. Review Summary Cache HIT

Use the exact same source-backed review payload twice.

Required request shape:

```json
{
  "restaurantName": "어니언 성수",
  "region": "KR",
  "reviews": [
    {
      "text": "주말에는 줄이 길고 빵 종류가 많아요.",
      "rating": 4.5,
      "source": "naver_blog",
      "sourceUrl": "https://example.com/mock/review-1"
    },
    {
      "text": "오픈런하면 대기가 짧고 앙버터가 유명해요.",
      "rating": 4.0,
      "source": "naver_cafe",
      "sourceUrl": "https://example.com/mock/review-2"
    }
  ]
}
```

Expected result:

- First response: HTTP 200, normally MISS or no `X-Cache`, source-backed summary body.
- Second response: HTTP 200 with `X-Cache: HIT`.
- `generatedAt` may remain the cached generation time on HIT.
- `sources` and `totalReviewCount` must still match the current request payload.
- Edge logs should include cache-hit wording such as `[cache] HIT summary`.
- Optional DB inspection, approval-only: `review_summary_cache.hit_count` increments and `source_hash` is stable.

## Failure Triage Package

If cache HIT fails after approval:

1. Confirm migration 005 objects exist.
2. Confirm Edge Functions are deployed from current local code.
3. Confirm service-role secret is available to Edge Functions.
4. Confirm the first request wrote cache successfully.
5. Confirm the second request used the exact same normalized key:
   - `searchCacheKey(region, query)`
   - `summaryCacheKey(region, restaurantName)` plus identical sorted review URL/source hash.
6. Stop before SQL inspection, redeploy, or secret checks unless the user explicitly approves.
