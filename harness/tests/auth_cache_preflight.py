#!/usr/bin/env python3
"""Authenticated E2E/cache-HIT preflight.

This is intentionally offline-only:
- no network requests
- no Supabase CLI commands
- no DB access
- no dotenv/env secret reads

It verifies that the local repo has the checkpoint package and code contracts
needed before the user approves a real authenticated/cache validation run.
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def assert_exists(path: str, desc: str) -> None:
    if not (ROOT / path).exists():
        raise AssertionError(f"{desc}: missing {path}")


def assert_contains(path: str, needle: str, desc: str) -> None:
    text = read(path)
    if needle not in text:
        raise AssertionError(f"{desc}: `{needle}` not found in {path}")


def assert_not_contains_text(text: str, needle: str, desc: str) -> None:
    if needle in text:
        raise AssertionError(f"{desc}: unexpected `{needle}`")


def validate_checkpoint_doc() -> None:
    doc = ".harness/state/authenticated-e2e-cache-hit-checkpoint.md"
    assert_exists(doc, "checkpoint package")

    required_phrases = [
        "Do not run the authenticated or cache",
        "EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY",
        "Email Confirm",
        "migration 005",
        "Edge Functions are deployed",
        "X-Cache: HIT",
        "Search Cache HIT",
        "Review Summary Cache HIT",
        "EXPO_NO_DOTENV=1 npm run web -- --port 8081",
        "approval-only",
        "Codex must not read or print those secrets",
    ]
    for phrase in required_phrases:
        assert_contains(doc, phrase, "checkpoint document contract")


def validate_cache_contract() -> None:
    migration = "supabase/migrations/005_add_edge_function_cache.sql"
    assert_exists(migration, "cache migration")
    for needle in [
        "CREATE TABLE IF NOT EXISTS public.search_cache",
        "CREATE TABLE IF NOT EXISTS public.review_summary_cache",
        "CREATE OR REPLACE FUNCTION public.increment_cache_hit",
        "hit_count",
        "source_hash",
    ]:
        assert_contains(migration, needle, "migration 005 cache objects")

    cache_util = "supabase/functions/_shared/cache.ts"
    for needle in [
        "SUPABASE_SERVICE_ROLE_KEY",
        "searchCacheKey",
        "summaryCacheKey",
        "readSearchCache",
        "writeSearchCache",
        "readSummaryCache",
        "writeSummaryCache",
        "increment_cache_hit",
    ]:
        assert_contains(cache_util, needle, "shared cache helper contract")

    search_fn = "supabase/functions/search-restaurant/index.ts"
    for needle in [
        "readSearchCache",
        "writeSearchCache",
        '"X-Cache": "HIT"',
        "cache MISS",
    ]:
        assert_contains(search_fn, needle, "search cache contract")

    summary_fn = "supabase/functions/summarize-reviews/index.ts"
    for needle in [
        "aggregateSources",
        "summaryCacheKey",
        "sourceHash",
        "readSummaryCache",
        "writeSummaryCache",
        '"X-Cache": "HIT"',
        "totalReviewCount: reviews.length",
        "sources",
    ]:
        assert_contains(summary_fn, needle, "summary cache contract")


def validate_local_flow_contract() -> None:
    for path in [
        "app/(auth)/login.tsx",
        "app/(auth)/register.tsx",
        "app/(auth)/mock-search.tsx",
        "src/components/SearchResultCard.tsx",
        "src/components/ReviewSummaryView.tsx",
        "src/components/SearchBar.tsx",
        "src/fixtures/searchPreview.ts",
    ]:
        assert_exists(path, "local pre-auth/mock route")

    assert_contains(
        "app/(auth)/login.tsx",
        'router.replace("/(auth)/register")',
        "login route must avoid stacking auth buttons",
    )
    assert_contains(
        "app/(auth)/register.tsx",
        'router.replace("/(auth)/login")',
        "register route must avoid stacking auth buttons",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-search-states",
        "mock route must expose stable state coverage",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-quick-filter-grid",
        "mock route must expose stable quick filters",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-result-filter-chips",
        "mock route must expose stable result filter chips",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-sort-chips",
        "mock route must expose stable sort chips",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "search-bar-clear-button",
        "search bar clear control must stay locally testable",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "testID={`search-result-card-${restaurant.id}`}",
        "result cards must stay browser-testable",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "getSafeWaitingSignal",
        "waitingSignal must be UI-validated before display",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "noContent || !hasSources",
        "source-less summaries must not render as fact",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "deepFreeze",
        "mock fixtures must not accumulate through mutation",
    )


def validate_safe_scripts() -> None:
    package = json.loads(read("package.json"))
    scripts = package.get("scripts", {})
    check = scripts.get("check", "")
    preflight = scripts.get("auth-cache:preflight", "")

    if "auth-cache:preflight" not in scripts:
        raise AssertionError("package scripts: auth-cache:preflight is missing")
    if "npm run auth-cache:preflight" not in check:
        raise AssertionError("package scripts: npm run check must include auth-cache:preflight")

    unsafe_check_fragments = [
        "deploy:fn",
        "supabase functions",
        "supabase db",
        "supabase migration",
        "curl ",
        ".env",
    ]
    for fragment in unsafe_check_fragments:
        assert_not_contains_text(check, fragment, "npm run check must remain local-only")

    unsafe_preflight_fragments = [
        "supabase ",
        "curl ",
        "fetch(",
        "requests.",
        "urllib",
        "dotenv",
        ".env",
        "deploy",
    ]
    for fragment in unsafe_preflight_fragments:
        assert_not_contains_text(
            preflight,
            fragment,
            "auth-cache preflight script command must remain local-only",
        )


def main() -> int:
    validate_checkpoint_doc()
    validate_cache_contract()
    validate_local_flow_contract()
    validate_safe_scripts()
    print("auth_cache_preflight: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
