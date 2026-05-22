# Checkpoints

Questions here require the user. Routine implementation questions do not.

## Open

- Confirm Supabase Email Confirm is OFF before authenticated login/session validation.
- Confirm `supabase/migrations/005_add_edge_function_cache.sql` has been manually executed before cache E2E validation.
- Approve Edge Function redeploy or Supabase SQL inspection if cache E2E should be fixed from this workstation; repeated calls currently return 200 but no `X-Cache: HIT`.
- Choose the next priority after cache validation: fetch-reviews TTL cache, map current-location UX, Figma/design polish, mobile build, or deployment.
- Approve any new API/data source such as Kakao, MangoPlate, Instagram, or similar external providers.

## Authenticated E2E / Cache HIT Plan

Do not run this plan until the user explicitly approves the required external access.

- Detailed checkpoint package: `.harness/state/authenticated-e2e-cache-hit-checkpoint.md`
- Supabase session/DB condition: user confirms a local test account can sign in without reading `.env`, and Supabase Email Confirm is OFF or a verified test session already exists.
- Migration condition: user confirms `supabase/migrations/005_add_edge_function_cache.sql` has been applied to the target database.
- Edge Function condition: user approves checking deployed function status/logs or redeploying `search-restaurant`, `fetch-reviews`, and `summarize-reviews`.
- Local-only preflight command: `npm run auth-cache:preflight`
- Local-only prep command: `EXPO_NO_DOTENV=1 npm run web -- --port 8081`
- Pre-auth regression check: confirm `/login` ↔ `/register` repeated navigation keeps interactive DOM count stable before entering any test credentials.
- Authenticated browser path after approval: sign in through `/login`, run a real home search, open the top restaurant detail, then confirm review fetch, AI summary, evidence/sourceCount, and no console errors.
- Cache HIT path after approval: repeat the same search/summary request with identical input and confirm response headers include `X-Cache: HIT` or document the exact miss reason.
- Deployment command only after approval: `npm run deploy:fn:all`

## Resolved

- None.
