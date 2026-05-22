# Run Log

Use short dated entries.

## 2026-05-16

- Created initial Lead Agent harness structure.
- Started food app stability run from central prompt. Classified as single-agent. Boundaries: target repo only, no `.env`, preserve source-backed summaries, Phase 19 review code, validators, fail-cases, and import-meta transformer.
- Installed target Lead Agent harness because it was missing. Updated target project brief/state with food app constraints.
- Baseline `npm run check` passed. Web boot at `http://localhost:8081` passed with no console errors.
- Fixed auth stability: signup success now handles immediate-session vs email-confirm flows; AuthProvider no longer stays loading if initial session lookup fails.
- Final `npm run check` passed. Cache E2E remains blocked on Supabase Email Confirm OFF and migration 005 confirmation.
- Continued user-priority pass: compacted home sort UI, tightened search card layout, added Google Places rating/review count passthrough, and added source-backed review waiting fallback. `npm run check` passed.
- Ran cache E2E after user said to proceed: fetch/search/summarize all returned 200, but repeated summarize/search calls did not return `X-Cache: HIT`. Recorded as cache E2E not passing yet; no SQL/deploy performed.
- User switched to semi-autonomous continuation for safe local work. External/service actions remain checkpoint-gated.
- Strengthened local validator for review-derived `waitingSignal`: evidence/sourceCount/range validation added. Targeted dry-run and `npm run check` passed.
- Added local app flow dry-run covering search data, review source attribution, source-backed summary, waiting signal, menu source rules, and UI wiring. Added it to `npm run check`.
- Fixed search bar flex sizing so the input shrinks before overlapping the submit button. `npm run check` passed.
- Booted Expo Web with `EXPO_NO_DOTENV=1`; login and register routes rendered with no browser console errors. Authenticated home/search browser E2E remains checkpoint-gated by external auth/DB rules.
- Redesigned the food app home/search UI toward a general search app: large search field, explicit CTA, quick filter chips, map/location affordance, scan-friendly result rows, and evidence count on detail summary. `npm run check` passed. Web login/register rendered with no console errors.
- Continued local polish with no external API/DB: extracted `SearchResultCard`, added sourceCount metadata, added fixture-backed `/mock-search`, strengthened ReviewSummaryView/detail waitingSignal display guards, and verified `/login`, `/register`, `/mock-search` in browser with no console errors. `npm run check` passed.
- Safe additive batch: enriched `/mock-search` with high-confidence, low-evidence, no-waiting, open/closed, empty, error, and auth/DB-needed states. Added testable card/summary IDs and search accessibility labels. Strengthened dry-run for source-less summaries, no-waiting summaries, invalid waitingSignal, and mock route state coverage. `npm run check` passed; Expo Web `/login`, `/register`, `/mock-search` rendered with zero console errors.
- Fixed auth button/link accumulation: reproduced `/login` ↔ `/register` footer navigation increasing interactive DOM nodes from 8 to 11 because auth links pushed new stack entries. Changed footer auth navigation to `router.replace`, stabilized mock quick-filter fixture arrays, and added dry-run regression checks. `npm run check` passed; repeated auth route clicks, reloads, and `/mock-search` reloads kept button/card counts stable with zero console errors.
- Expanded safe local `/mock-search` coverage: added long restaurant/long chip/long summary fixtures, deeply froze mock fixtures, improved chip/source text shrink/wrap behavior, and added dry-run checks for long text states plus fixture mutation guards. `npm run check` passed; browser reloads kept `/mock-search` at 6 result cards, 1 state section, 1 quick grid, and zero console errors. Auth `/login` ↔ `/register` remained stable at 8 interactive DOM nodes across repeated replace navigation.

## 2026-05-17

- Prepared authenticated E2E/cache HIT checkpoint package without Supabase/API access. Added local-only `auth-cache:preflight` to verify checkpoint docs, migration/cache code contracts, auth route stability guards, and mock route coverage before any real connection.
- `npm run check` passed with the new preflight included. Expo Web with `EXPO_NO_DOTENV=1` rendered `/login`, `/register`, and `/mock-search` with zero console errors. Auth route replace navigation stayed stable, and `/mock-search` reloads stayed at 6 result cards, 1 state section, and 1 quick grid.
- Continued local/mock-only service polish: added SearchBar focus/clear behavior, empty-query notice, recent/popular search states, location affordance, result filter/sort chips, card confidence/status chips, representative review evidence, and source-less summary hiding. `npm run check` passed. Browser checks: `/login` 30 interactive nodes, `/register` 32 interactive nodes, stable across repeated replace navigation; `/mock-search` reloads stayed at 6 result cards, 1 state section, 1 quick grid, 1 filter row, 1 sort row, 5 confidence summaries, 2 info-none summaries, and zero console errors. Mobile viewport smoke at 390x844 also had zero console errors.

## 2026-05-22

- Added project-local Android operations/optimization checklist at `docs/ANDROID_APP_OPERATIONS_CHECKLIST.md` based on central ops 기준. Included local-only Expo lint/bundle-analysis runbook and explicit forbidden actions for automation.
- Linked the new ops preflight into `docs/testing-checklist.md`.
- Verified local-only baseline: `npm run check` passed (typecheck + validators + dry-runs).
- Added `summary_raw_free` validator to prevent raw provider body / LLM prompt/messages / credential-like strings from leaking into `review_summary_v2`. Updated fail-case coverage and verified `npm run check` still passes. (commit `899794f`)
- Improved long search results list stability: memoized `SearchResultCard` and switched to id-based press handler to reduce per-item closure/object churn. Verified `npm run check` passes.
