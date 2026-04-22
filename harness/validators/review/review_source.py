"""review_source validator
리뷰 항목에 source(출처)가 없으면 실패를 반환한다.
"""


def validate(data: dict) -> dict:
    """리뷰 목록의 각 항목에 source 필드가 있는지 검사한다."""
    reviews = data.get("reviews", [])
    if not reviews:
        return {"valid": True, "validator": "review_source"}

    for i, review in enumerate(reviews):
        if "source" not in review:
            return {
                "valid": False,
                "validator": "review_source",
                "error": f"리뷰[{i}]에 source(출처)가 없습니다",
            }
    return {"valid": True, "validator": "review_source"}
