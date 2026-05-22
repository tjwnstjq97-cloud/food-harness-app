# Project Brief

Durable Lead Agent context for `food-harness-app`.

## Product Goal

Build a cross-platform Expo app that lets a user search for a restaurant and see source-backed external review summaries. The core product is automatic collection and AI summarization of public restaurant reviews into positive points, negative points, and signature menus. User-written review UI is intentionally hidden unless explicitly approved.

## Current Strategy

Current priority from the user: find app bugs and complete basic operation.

Work from the existing Expo SDK 54 + TypeScript + Supabase architecture. The fastest verification path is web boot plus `npm run check`. Cache E2E validation is gated on two user confirmations: Supabase Email Confirm is OFF, and migration `005_add_edge_function_cache.sql` has been manually executed in Supabase.

## Non-Negotiables

- Do not read, modify, print, or stage `.env` files.
- Summaries must be source-backed. When source-backed data is unavailable, show `정보 없음`.
- Preserve Phase 19 user review code, DB, and RLS even though its UI is hidden.
- Preserve the 18 validators and 7 fail-cases.
- Preserve `harness/scripts/import-meta-safe-transformer.js`; web build depends on it.
- API keys and service-role secrets must stay server-side and never be hardcoded.
- KR/GLOBAL region branching remains mandatory for search, maps, reviews, and external data.

## User Preferences

- The user wants to set direction and review meaningful checkpoints.
- The Lead Agent should handle routine planning, implementation, review, and verification.
- Ask the user only for real product, account, risk, or approval decisions.

## Current Workstreams

1. P0: Basic app stability: `npm run check`, fastest web boot, and bounded blocker fixes.
2. P0 gated: Top 1 cache E2E validation after required Supabase confirmations.
3. P1: Fetch-reviews TTL cache if cache validation is blocked or completed.
4. P2: Map current-location UX, design polish, mobile build, or deployment after user priority choice.
