#!/usr/bin/env python3
"""Local app-flow dry-run.

No network, no database, no secrets. This checks that the app's core
search -> fetch reviews -> summarize -> UI guard contract is still wired.
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
VALIDATORS = ROOT / "harness" / "validators"
sys.path.insert(0, str(VALIDATORS))

from base.required_fields import validate as validate_required_fields
from region.region_logic import validate as validate_region
from review.review_source import validate as validate_review_source
from review.summary_source_required import validate as validate_summary_source
from data.menu_source_required import validate as validate_menu_source


def assert_valid(desc: str, result: dict) -> None:
    if not result.get("valid"):
        raise AssertionError(f"{desc}: {result.get('error')}")


def assert_invalid(desc: str, result: dict) -> None:
    if result.get("valid"):
        raise AssertionError(f"{desc}: invalid fixture was accepted")


def assert_contains(path: str, needle: str, desc: str) -> None:
    text = (ROOT / path).read_text(encoding="utf-8")
    if needle not in text:
        raise AssertionError(f"{desc}: `{needle}` not found in {path}")


def assert_order(path: str, first: str, second: str, desc: str) -> None:
    text = (ROOT / path).read_text(encoding="utf-8")
    first_i = text.find(first)
    second_i = text.find(second)
    if first_i == -1 or second_i == -1 or first_i >= second_i:
        raise AssertionError(f"{desc}: expected `{first}` before `{second}` in {path}")


def assert_not_contains(path: str, needle: str, desc: str) -> None:
    text = (ROOT / path).read_text(encoding="utf-8")
    if needle in text:
        raise AssertionError(f"{desc}: unexpected `{needle}` found in {path}")


def validate_fixture_flow() -> None:
    restaurant = {
        "id": "naver_1270000000_375000000",
        "name": "어니언 성수",
        "region": "KR",
        "category": "카페,디저트",
        "source": "naver",
    }
    assert_valid("restaurant required fields", validate_required_fields(restaurant))
    assert_valid("restaurant region", validate_region(restaurant))

    reviews = {
        "reviews": [
            {
                "text": "주말에는 줄이 길고 빵 종류가 많아요.",
                "rating": 4.5,
                "source": "naver_blog",
                "sourceUrl": "https://blog.naver.com/example/1",
            },
            {
                "text": "오픈런하면 대기가 짧고 앙버터가 유명해요.",
                "rating": 4.0,
                "source": "naver_cafe",
                "sourceUrl": "https://cafe.naver.com/example/2",
            },
        ]
    }
    assert_valid("review source attribution", validate_review_source(reviews))

    summary = {
        "review_summary_v2": {
            "positivePoints": ["빵 종류 다양", "대표 메뉴 언급"],
            "negativePoints": ["주말 대기 길음"],
            "signatureMenus": [
                {"name": "앙버터", "mentionCount": 2},
                {"name": "소금빵", "mentionCount": 1},
            ],
            "waitingSignal": {
                "label": "주말 대기 길음",
                "evidence": "주말 줄이 길고 오픈런하면 대기가 짧다는 리뷰",
                "minMinutes": 20,
                "maxMinutes": 40,
                "sourceCount": 2,
            },
            "totalReviewCount": 2,
            "sources": [
                {"type": "naver_blog", "count": 1, "urls": ["https://blog.naver.com/example/1"]},
                {"type": "naver_cafe", "count": 1, "urls": ["https://cafe.naver.com/example/2"]},
            ],
            "generatedAt": "2026-05-16T00:00:00Z",
        }
    }
    assert_valid("summary source/waiting contract", validate_summary_source(summary))

    missing_waiting_evidence = {
        "review_summary_v2": {
            **summary["review_summary_v2"],
            "waitingSignal": {
                "label": "주말 대기 길음",
                "sourceCount": 2,
            },
        }
    }
    assert_invalid(
        "waiting signal without evidence",
        validate_summary_source(missing_waiting_evidence),
    )

    invalid_waiting_source_count = {
        "review_summary_v2": {
            **summary["review_summary_v2"],
            "waitingSignal": {
                "label": "주말 대기 길음",
                "evidence": "줄이 길다는 리뷰",
                "sourceCount": 0,
            },
        }
    }
    assert_invalid(
        "waiting signal with invalid sourceCount",
        validate_summary_source(invalid_waiting_source_count),
    )

    invalid_waiting_range = {
        "review_summary_v2": {
            **summary["review_summary_v2"],
            "waitingSignal": {
                "label": "주말 대기 길음",
                "evidence": "줄이 길다는 리뷰",
                "minMinutes": 60,
                "maxMinutes": 20,
                "sourceCount": 2,
            },
        }
    }
    assert_invalid(
        "waiting signal with invalid minute range",
        validate_summary_source(invalid_waiting_range),
    )

    no_waiting_summary = {
        "review_summary_v2": {
            **summary["review_summary_v2"],
            "waitingSignal": None,
        }
    }
    assert_valid(
        "summary without waiting signal",
        validate_summary_source(no_waiting_summary),
    )

    source_less_summary = {
        "review_summary_v2": {
            **summary["review_summary_v2"],
            "totalReviewCount": 3,
            "sources": [],
            "waitingSignal": None,
        }
    }
    assert_invalid(
        "source-less summary with reviews",
        validate_summary_source(source_less_summary),
    )

    source_less_ui_fixture = {
        "review_summary_v2": {
            "positivePoints": ["출처 없는 장점"],
            "negativePoints": ["출처 없는 주의점"],
            "signatureMenus": [{"name": "출처 없는 메뉴", "mentionCount": 1}],
            "waitingSignal": None,
            "totalReviewCount": 3,
            "sources": [],
            "generatedAt": "2026-05-16T00:00:00Z",
        }
    }
    assert_invalid(
        "source-less UI fixture with review count",
        validate_summary_source(source_less_ui_fixture),
    )

    zero_review_info_none = {
        "review_summary_v2": {
            "positivePoints": [],
            "negativePoints": [],
            "signatureMenus": [],
            "waitingSignal": None,
            "totalReviewCount": 0,
            "sources": [],
            "generatedAt": "2026-05-16T00:00:00Z",
        }
    }
    assert_valid(
        "zero review info-none summary",
        validate_summary_source(zero_review_info_none),
    )

    menus = {
        "menus": [
            {
                "name": "앙버터",
                "price": 0,
                "priceStatus": "unknown",
                "source": "review_extracted",
                "isSignature": True,
            }
        ]
    }
    assert_valid("menu source contract", validate_menu_source(menus))


def validate_source_contracts() -> None:
    assert_order(
        "src/hooks/useReviewSummary.ts",
        '"fetch-reviews"',
        '"summarize-reviews"',
        "review summary must fetch source reviews before AI summary",
    )
    assert_contains(
        "src/hooks/useReviewSummary.ts",
        "return EMPTY_SUMMARY",
        "review summary failures must degrade safely",
    )
    assert_contains(
        "src/hooks/useSearch.ts",
        "placeholderData: keepPreviousData",
        "search must avoid blanking results while fetching",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "minWidth: 0",
        "search input must not overlap the submit button on narrow screens",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "flexShrink: 0",
        "search submit button must keep its tappable width while input shrinks",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "accessibilityLabel",
        "search input and submit button must expose accessible labels",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "search-bar-clear-button",
        "search bar must expose a testable clear button",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "onFocus={() => setIsFocused(true)}",
        "search bar must expose focus state styling",
    )
    assert_contains(
        "src/components/SearchBar.tsx",
        "onClear",
        "search bar clear action must allow parent screens to reset submitted results",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "QUICK_FILTERS_KR",
        "home must expose quick filter chips for search-app style discovery",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "mapSearchButton",
        "home must expose a map/location search affordance",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "home-location-selector",
        "home must expose a current-location/area selector affordance",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "home-empty-query-notice",
        "home must handle empty submitted searches explicitly",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "POPULAR_SEARCHES_KR",
        "home must expose mock popular searches before real service data",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "home-result-filter-chips",
        "home result screen must expose stable result filter chips",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "RESULT_FILTER_LABELS",
        "home result filters must be stable module-level labels",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "resultMetaRow",
        "search results must use scan-friendly metadata rows",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "근거 정보 없음",
        "search result card must show a safe no-evidence state",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "sourceCount",
        "search result card must surface source count",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "testID={`search-result-card-${restaurant.id}`}",
        "search result cards must be test-addressable in mock/browser checks",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "businessStatusLabel",
        "search result card must support open/closed status labels",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "confidenceLabel",
        "search result card must surface AI summary confidence",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "rowGap",
        "search result metadata row must wrap without overlap for long text",
    )
    assert_contains(
        "src/components/SearchResultCard.tsx",
        "flexShrink: 1",
        "search result chip text must shrink instead of overflowing",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "noContent || !hasSources",
        "UI must hide source-less summaries",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "review-summary-empty",
        "review summary UI must expose a testable info-none state",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "review-summary-evidence",
        "review summary UI must expose testable evidence/sourceCount state",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "review-summary-confidence",
        "review summary UI must expose testable confidence state",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "review-summary-representative-review",
        "review summary UI must expose source-backed representative review text",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "review-summary-representative-empty",
        "review summary UI must show info-none when representative source text is unavailable",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "review-summary-waiting-unknown",
        "review summary UI must show a safe no-waiting-information state",
    )
    assert_contains(
        "src/components/ReviewSummaryView.tsx",
        "getSafeWaitingSignal",
        "review summary UI must validate waitingSignal before display",
    )
    assert_contains(
        "app/restaurant/[id].tsx",
        "reviewWaitingFallback",
        "detail page must support review-derived waiting fallback",
    )
    assert_contains(
        "app/(tabs)/index.tsx",
        "SORT_A11Y_LABELS",
        "home sort must keep accessible full labels",
    )
    assert_contains(
        "app/restaurant/[id].tsx",
        "summaryEvidenceText",
        "detail page must surface source/evidence count near AI summary",
    )
    assert_contains(
        "app/restaurant/[id].tsx",
        "summaryConfidenceLabel",
        "detail page must surface AI summary confidence",
    )
    assert_contains(
        "app/restaurant/[id].tsx",
        "representativeReview",
        "detail page must surface representative review text only when source-backed",
    )
    assert_contains(
        "app/restaurant/[id].tsx",
        "getSafeWaitingSignal",
        "detail page must validate waitingSignal before display",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewReviewSummary",
        "mock preview must use source-backed summary fixture",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewLowEvidenceSummary",
        "mock fixture must include a low-evidence summary state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewNoWaitingSummary",
        "mock fixture must include a no-waitingSignal summary state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewInvalidWaitingSummary",
        "mock fixture must include an invalid waitingSignal state for UI hiding",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "mock_low_evidence_taco",
        "mock fixture must include a low review/sourceCount result",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "mock_long_chip_omakase",
        "mock fixture must include a long restaurant/chip stress result",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewLongTextSummary",
        "mock fixture must include a long summary text stress state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewRecentQueries",
        "mock fixture must include recent search state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewEmptyRecentQueries",
        "mock fixture must include empty recent search state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewPopularQueries",
        "mock fixture must include popular search state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "previewSourceLessSummary",
        "mock fixture must include source-less summary hiding state",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "representativeReviews",
        "mock summaries must include source-backed representative review text",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "SearchResultCard",
        "mock preview must render search result cards without DB/API",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-quick-filter-grid",
        "mock preview must expose a testable quick chip grid",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-recent-searches",
        "mock preview must expose recent search state",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-recent-empty",
        "mock preview must expose empty recent state",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-popular-searches",
        "mock preview must expose popular search state",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-result-filter-chips",
        "mock preview must expose stable result filter chips",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-sort-chips",
        "mock preview must expose stable sort chips",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-location-selector",
        "mock preview must expose current-location affordance",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "긴 chip 텍스트 줄바꿈 방지 테스트",
        "mock preview must include a long chip overflow stress case",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "mock-search-states",
        "mock preview must render loading/empty/error/auth-needed states",
    )
    assert_contains(
        "app/(auth)/_layout.tsx",
        "mock-search",
        "mock-search route must be explicit in the auth stack",
    )
    assert_contains(
        "app/(auth)/login.tsx",
        'router.replace("/(auth)/register")',
        "auth footer navigation must replace instead of stacking duplicate login/register buttons",
    )
    assert_contains(
        "app/(auth)/register.tsx",
        'router.replace("/(auth)/login")',
        "auth footer navigation must replace instead of stacking duplicate login/register buttons",
    )
    assert_not_contains(
        "app/(auth)/login.tsx",
        "import { Link",
        "login/register footer must not use push-style Link navigation",
    )
    assert_not_contains(
        "app/(auth)/register.tsx",
        "import { Link",
        "login/register footer must not use push-style Link navigation",
    )
    assert_contains(
        "app/(auth)/mock-search.tsx",
        "MOCK_QUICK_FILTERS",
        "mock quick chips must use a stable module-level array",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "deepFreeze",
        "mock fixture arrays/maps should be deeply frozen to prevent import-time accumulation",
    )
    assert_contains(
        "src/fixtures/searchPreview.ts",
        "ReadonlyArray<Restaurant>",
        "mock restaurant fixture must be typed readonly",
    )
    assert_not_contains(
        "src/fixtures/searchPreview.ts",
        ".push(",
        "mock fixture must not append to shared arrays",
    )
    assert_not_contains(
        "src/fixtures/searchPreview.ts",
        ".splice(",
        "mock fixture must not mutate shared arrays",
    )
    assert_contains(
        "supabase/functions/fetch-reviews/index.ts",
        "Promise.allSettled",
        "fetch-reviews should tolerate partial source failure",
    )


def main() -> int:
    validate_fixture_flow()
    validate_source_contracts()
    print("app_flow_dry_run: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
