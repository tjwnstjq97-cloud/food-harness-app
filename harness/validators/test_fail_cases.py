#!/usr/bin/env python3
"""실패 케이스 검증 - 각 validator가 위반 데이터를 정확히 잡는지 테스트"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from base.required_fields import validate as v_required
from base.no_sensitive_logs import validate as v_sensitive
from region.region_logic import validate as v_region
from review.review_source import validate as v_review
from review.user_review_ownership import validate as v_user_review_ownership
from review.no_oneline_summary import validate as v_no_oneline_summary
from reservation.reservation_check import validate as v_reservation

FAIL_CASES = [
    (
        "필수 필드 누락",
        v_required,
        {"category": "한식"},  # name, region 없음
    ),
    (
        "민감 정보 포함",
        v_sensitive,
        {"name": "식당", "region": "KR", "category": "한식", "API_KEY": "sk-12345"},
    ),
    (
        "잘못된 region 값",
        v_region,
        {"name": "식당", "region": "JP", "category": "한식"},
    ),
    (
        "리뷰 출처 누락",
        v_review,
        {"reviews": [{"text": "맛있어요", "rating": 4.5}]},  # source 없음
    ),
    (
        "예약 링크 누락",
        v_reservation,
        {"reservation": {"available": True}},  # link 없음
    ),
    (
        "사용자 리뷰에 user_id 누락",
        v_user_review_ownership,
        {"reviews": [{"text": "직접 작성", "rating": 5.0, "source": "user"}]},  # user_id 없음
    ),
]


def _test_no_oneline_summary_detects_forbidden_pattern() -> bool:
    """no_oneline_summary 검사가 임시 디렉터리 내 금지 패턴을 잡는지 확인."""
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        bad = os.path.join(tmp, "bad.ts")
        with open(bad, "w", encoding="utf-8") as f:
            f.write("export function summarizeReview(r: string) { return r; }\n")
        result = v_no_oneline_summary({"project_root": tmp})
        return not result["valid"]

print("=" * 50)
print("실패 케이스 검증")
print("=" * 50)

all_correct = True
for desc, validator_fn, data in FAIL_CASES:
    result = validator_fn(data)
    if result["valid"]:
        print(f"  [ERROR] {desc} - 실패를 잡지 못함!")
        all_correct = False
    else:
        print(f"  [OK] {desc} -> {result['error']}")

# 임시 파일 기반 테스트 (run_all 통합이 어려운 케이스)
extra_ok = _test_no_oneline_summary_detects_forbidden_pattern()
if extra_ok:
    print("  [OK] no_oneline_summary - 임시 디렉터리 금지 패턴 탐지")
else:
    print("  [ERROR] no_oneline_summary - 임시 디렉터리 금지 패턴 미탐지!")
    all_correct = False

print("=" * 50)
if all_correct:
    print("결과: 모든 실패 케이스를 정확히 탐지")
else:
    print("결과: 일부 실패 케이스 미탐지")
print("=" * 50)

sys.exit(0 if all_correct else 1)
