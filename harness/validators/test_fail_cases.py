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
from review.summary_source_required import validate as v_summary_source
from review.summary_raw_free import validate as v_summary_raw_free
from review.summary_source_urls_safe import validate as v_summary_source_urls_safe
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
    (
        "자동 요약에 sources 비어있음",
        v_summary_source,
        {
            "review_summary_v2": {
                "positivePoints": ["맛있다"],
                "negativePoints": [],
                "totalReviewCount": 5,
                "sources": [],  # 출처 없음 — 실패해야 함
                "generatedAt": "2026-04-28T00:00:00Z",
            }
        },
    ),
    (
        "자동 요약에 prompt/raw 키 포함",
        v_summary_raw_free,
        {
            "review_summary_v2": {
                "positivePoints": ["맛있다"],
                "negativePoints": [],
                "totalReviewCount": 1,
                "sources": [{"type": "naver_blog", "count": 1, "urls": []}],
                "generatedAt": "2026-04-28T00:00:00Z",
                "prompt": "SYSTEM: you are ...",  # raw 노출 금지 — 실패해야 함
            }
        },
    ),
    (
        "자동 요약에 이메일/전화번호(PII) 포함",
        v_summary_raw_free,
        {
            "review_summary_v2": {
                "positivePoints": ["연락은 test.user@example.com 으로 주세요"],
                "negativePoints": [],
                "totalReviewCount": 1,
                "sources": [{"type": "naver_blog", "count": 1, "urls": []}],
                "generatedAt": "2026-04-28T00:00:00Z",
            }
        },
    ),
    (
        "자동 요약 sources.urls에 token query 포함",
        v_summary_source_urls_safe,
        {
            "review_summary_v2": {
                "positivePoints": ["맛있다"],
                "negativePoints": [],
                "totalReviewCount": 1,
                "sources": [
                    {
                        "type": "naver_blog",
                        "count": 1,
                        "urls": ["https://example.com/post?access_token=abc123"],
                    }
                ],
                "generatedAt": "2026-04-28T00:00:00Z",
            }
        },
    ),
]

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

print("=" * 50)
if all_correct:
    print("결과: 모든 실패 케이스를 정확히 탐지")
else:
    print("결과: 일부 실패 케이스 미탐지")
print("=" * 50)

sys.exit(0 if all_correct else 1)
