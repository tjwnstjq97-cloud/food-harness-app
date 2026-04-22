#!/usr/bin/env python3
"""run_all.py - 모든 validator를 순서대로 실행한다.
현재는 더미 데이터 기준으로 동작하며, 추후 실제 앱 데이터에 맞춰 확장한다.
"""

import sys
import os

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from base.required_fields import validate as validate_required_fields
from base.no_sensitive_logs import validate as validate_no_sensitive_logs
from region.region_logic import validate as validate_region
from review.review_source import validate as validate_review_source
from reservation.reservation_check import validate as validate_reservation
from waiting.waiting_evidence import validate as validate_waiting
from user.user_ownership import validate as validate_ownership
from security.api_exposure import validate as validate_api_exposure
from security.hardcoded_key import validate as validate_hardcoded_key
from security.env_access import validate as validate_env_access
from security.service_role_key import validate as validate_service_role
from review.review_sentiment import validate as validate_review_sentiment
from security.pii_in_logs import validate as validate_pii_in_logs
from security.console_debug import validate as validate_console_debug
from data.restaurant_region_required import validate as validate_region_required
from data.menu_source_required import validate as validate_menu_source

# 더미 테스트 데이터 (정상 케이스)
SAMPLE_DATA = {
    "name": "맛있는 식당",
    "region": "KR",
    "category": "한식",
    "reviews": [
        {"text": "맛있어요", "rating": 4.5, "source": "naver"},
        {"text": "분위기 좋음", "rating": 4.0, "source": "kakao"},
    ],
    "reservation": {
        "available": True,
        "link": "https://example.com/reserve",
    },
    "waiting": {
        "minutes": 15,
        "evidence": "네이버 실시간 웨이팅 데이터",
    },
    "history": [
        {"restaurant": "맛있는 식당", "visited_at": "2026-04-10", "user_id": "user_001", "restaurant_region": "KR"},
    ],
    "favorites": [
        {"restaurant": "맛있는 식당", "user_id": "user_001", "restaurant_region": "KR"},
    ],
    "review_summary": {
        "positive": ["맛있어요", "분위기 좋음"],
        "negative": ["웨이팅이 길다"],
    },
    "client_api_urls": [],  # 클라이언트에서 직접 호출하는 URL (비어있으면 통과)
    "project_root": os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."),
    "menus": [
        {"name": "된장찌개", "price": 9000, "priceStatus": "confirmed", "source": "naver_place", "isSignature": True},
        {"name": "김치찌개", "price": 8000, "priceStatus": "estimated", "source": "user_input", "isSignature": False},
    ],
}

VALIDATORS = [
    ("required_fields", validate_required_fields),
    ("no_sensitive_logs", validate_no_sensitive_logs),
    ("region_logic", validate_region),
    ("review_source", validate_review_source),
    ("reservation_check", validate_reservation),
    ("waiting_evidence", validate_waiting),
    ("user_ownership", validate_ownership),
    ("api_exposure", validate_api_exposure),
    ("hardcoded_key", validate_hardcoded_key),
    ("env_access", validate_env_access),
    ("service_role_key", validate_service_role),
    ("review_sentiment", validate_review_sentiment),
    ("pii_in_logs", validate_pii_in_logs),
    ("console_debug", validate_console_debug),
    ("restaurant_region_required", validate_region_required),
    ("menu_source_required", validate_menu_source),
]


def run_all(data: dict) -> bool:
    """모든 validator를 순차 실행하고 결과를 출력한다."""
    all_passed = True
    print(f"{'='*50}")
    print("VALIDATOR 실행 결과")
    print(f"{'='*50}")

    for name, validator_fn in VALIDATORS:
        result = validator_fn(data)
        status = "PASS" if result["valid"] else "FAIL"
        print(f"  [{status}] {name}")
        if not result["valid"]:
            print(f"         -> {result['error']}")
            all_passed = False

    print(f"{'='*50}")
    if all_passed:
        print("결과: 모든 검증 통과")
    else:
        print("결과: 검증 실패 항목 있음")
    print(f"{'='*50}")
    return all_passed


if __name__ == "__main__":
    passed = run_all(SAMPLE_DATA)
    sys.exit(0 if passed else 1)
