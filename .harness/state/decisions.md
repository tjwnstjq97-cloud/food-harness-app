# Decisions

Durable project decisions go here.

## Accepted

- The user wants Codex to act as Lead Agent and reduce repeated PM handoff.
- Routine planning, implementation, review, and verification should happen autonomously.
- User input is reserved for meaningful checkpoints listed in `AGENTS.md`.
- Product essence is external restaurant review collection and AI summary, not user-written review UI.
- All generated summaries must be backed by review sources; unavailable data should render as `정보 없음`.
- Phase 19 user review code/DB/RLS, 18 validators, 7 fail-cases, and `harness/scripts/import-meta-safe-transformer.js` must be preserved.
- Cache E2E validation requires user confirmation that Supabase Email Confirm is OFF and migration 005 has been executed manually.
- Semi-autonomous continuation is approved for local code edits, mock/dry-run, tests, docs, safe refactors, UI stabilization, and validator improvements.
- Must still stop for `.env` access, DB migrations, deployment, production/staging access, real external API calls, payment/publish/email actions, secret read/output, destructive git, operating-data rewrite/delete, and high-stakes advisory automation.

## Pending

- Choose next priority after cache validation: fetch-reviews TTL cache, map current-location UX, Figma/design polish, mobile build, or deployment.
