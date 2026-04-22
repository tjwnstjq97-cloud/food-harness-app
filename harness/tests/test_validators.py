#!/usr/bin/env python3
"""validator 테스트 시뮬레이션
실제 앱에서 발생 가능한 다양한 데이터 시나리오를 검증한다.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "validators"))

from base.required_fields import validate as v_required
from base.no_sensitive_logs import validate as v_sensitive
from region.region_logic import validate as v_region
from review.review_source import validate as v_review
from reservation.reservation_check import validate as v_reservation

passed = 0
failed = 0


def check(test_name: str, result: dict, expect_valid: bool):
    global passed, failed
    if result["valid"] == expect_valid:
        passed += 1
        print(f"  [PASS] {test_name}")
    else:
        failed += 1
        status = "valid" if result["valid"] else "invalid"
        print(f"  [FAIL] {test_name} - 예상: {'valid' if expect_valid else 'invalid'}, 실제: {status}")
        if not result["valid"]:
            print(f"         -> {result.get('error', 'N/A')}")


# ========================================
# 1. required_fields 테스트
# ========================================
print("\n[required_fields]")
check("정상 데이터", v_required({"name": "식당A", "region": "KR", "category": "한식"}), True)
check("name 누락", v_required({"region": "KR", "category": "한식"}), False)
check("region 누락", v_required({"name": "식당A", "category": "한식"}), False)
check("category 누락", v_required({"name": "식당A", "region": "KR"}), False)
check("전부 누락", v_required({}), False)
check("추가 필드 있어도 통과", v_required({"name": "식당A", "region": "KR", "category": "한식", "extra": True}), True)

# ========================================
# 2. no_sensitive_logs 테스트
# ========================================
print("\n[no_sensitive_logs]")
check("정상 데이터", v_sensitive({"name": "식당A", "region": "KR"}), True)
check("API_KEY 키 포함", v_sensitive({"API_KEY": "sk-abc123"}), False)
check("secret 키 포함", v_sensitive({"secret": "mysecret"}), False)
check("token 키 포함", v_sensitive({"access_token": "tok123"}), False)
check("password 키 포함", v_sensitive({"password": "pass123"}), False)
check("값에 API_KEY= 패턴", v_sensitive({"config": "API_KEY=abc123"}), False)

# ========================================
# 3. region_logic 테스트
# ========================================
print("\n[region_logic]")
check("KR 정상", v_region({"region": "KR"}), True)
check("GLOBAL 정상", v_region({"region": "GLOBAL"}), True)
check("JP 비허용", v_region({"region": "JP"}), False)
check("빈 문자열", v_region({"region": ""}), False)
check("region 없음", v_region({}), False)
check("소문자 kr 비허용", v_region({"region": "kr"}), False)

# ========================================
# 4. review_source 테스트
# ========================================
print("\n[review_source]")
check("리뷰 없음 (통과)", v_review({}), True)
check("빈 리뷰 배열 (통과)", v_review({"reviews": []}), True)
check("출처 있는 리뷰", v_review({"reviews": [{"text": "좋아요", "source": "naver"}]}), True)
check("출처 없는 리뷰", v_review({"reviews": [{"text": "좋아요"}]}), False)
check("혼합 (두번째 누락)", v_review({"reviews": [
    {"text": "좋아요", "source": "naver"},
    {"text": "별로", "rating": 2.0},
]}), False)

# ========================================
# 5. reservation_check 테스트
# ========================================
print("\n[reservation_check]")
check("예약 없음 (통과)", v_reservation({}), True)
check("예약+링크 있음", v_reservation({"reservation": {"available": True, "link": "https://example.com"}}), True)
check("예약 있지만 링크 없음", v_reservation({"reservation": {"available": True}}), False)
check("예약 있지만 링크 빈 문자열", v_reservation({"reservation": {"available": True, "link": ""}}), False)

# ========================================
# 통합 시나리오
# ========================================
print("\n[통합 시나리오]")

complete_valid = {
    "name": "을지로 골목식당",
    "region": "KR",
    "category": "한식",
    "reviews": [
        {"text": "곰탕이 일품", "rating": 4.8, "source": "naver"},
        {"text": "가성비 좋음", "rating": 4.2, "source": "kakao"},
    ],
    "reservation": {"available": True, "link": "https://booking.example.com/123"},
}
check("완전한 정상 데이터 (모든 validator)", v_required(complete_valid), True)
check("완전한 정상 데이터 (민감정보)", v_sensitive(complete_valid), True)
check("완전한 정상 데이터 (region)", v_region(complete_valid), True)
check("완전한 정상 데이터 (리뷰)", v_review(complete_valid), True)
check("완전한 정상 데이터 (예약)", v_reservation(complete_valid), True)

# ========================================
# 결과 요약
# ========================================
total = passed + failed
print(f"\n{'='*50}")
print(f"테스트 결과: {passed}/{total} 통과, {failed} 실패")
print(f"{'='*50}")

sys.exit(0 if failed == 0 else 1)
