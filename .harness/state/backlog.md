# Backlog

Add discovered or user-requested work here.

## Ready

- Fix bounded bugs that block basic operation while preserving source-backed summary rules.
- If required Supabase confirmations are available, validate Top 1 cache E2E with repeated summarize flow and `X-Cache: HIT`.
- After login/cache checkpoints are confirmed, run authenticated home search E2E to compare real home/detail screens against `/mock-search` fixture preview.

## Later

- Add fetch-reviews TTL cache.
- Improve map current-location UX.
- Apply Figma/design polish when a design source is provided.
- Prepare mobile build or deployment when approved.
- Evaluate new approved data sources for richer direct menu/waiting coverage.

## Done

- Baseline stability verification: `npm run check` and fastest web boot.
- Local app flow dry-run added to `npm run check`.
- Search-app style home/result/detail redesign completed locally.
- Fixture-only `/mock-search` preview added for browser verification without Supabase auth.
- `/mock-search` safe additive states expanded for high confidence, low evidence, no waitingSignal, open/closed, empty, error, and auth/DB-needed rendering.
- Auth login/register footer navigation no longer stacks duplicate hidden button/link nodes.
- `/mock-search` now includes long restaurant name, long quick chip, long summary text, and deep-frozen fixture stress cases for local browser regression.
- Local/mock search polish now covers SearchBar focus/clear, empty-query handling, recent/popular query states, location affordance, result filter/sort chips, AI confidence, representative review sentences, and source-less summary hiding.
