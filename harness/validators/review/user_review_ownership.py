"""user_review_ownership validator (Phase 19)
사용자 작성 리뷰(source='user')에 user_id가 없으면 실패.

근거:
  - 사용자 직접 작성 리뷰는 본인이 수정/삭제할 수 있어야 함
  - 본인 식별이 안 되면 RLS 정책이 작동하지 않음
  - source='user'인데 user_id가 비어있으면 데이터 손상 또는 마이그레이션 누락
"""


def validate(data: dict) -> dict:
    """source='user' 리뷰는 user_id가 반드시 존재해야 한다."""
    reviews = data.get("reviews", [])
    if not reviews:
        return {"valid": True, "validator": "user_review_ownership"}

    for i, review in enumerate(reviews):
        source = review.get("source")
        if source != "user":
            continue
        # camelCase(userId) 또는 snake_case(user_id) 둘 다 인정
        user_id = review.get("user_id") or review.get("userId")
        if not user_id:
            return {
                "valid": False,
                "validator": "user_review_ownership",
                "error": (
                    f"리뷰[{i}] source='user'인데 user_id가 없습니다. "
                    "사용자 작성 리뷰는 소유권 분리 필수."
                ),
            }

    return {"valid": True, "validator": "user_review_ownership"}
