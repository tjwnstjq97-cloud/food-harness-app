"""review_sentiment validator
리뷰 요약(summary)이 있을 경우 positive/negative 분리가 되어 있는지 검사한다.
"""


def validate(data: dict) -> dict:
    """리뷰 요약에 positive/negative 키가 모두 있는지 검사한다."""
    summary = data.get("review_summary")
    if not summary:
        return {"valid": True, "validator": "review_sentiment"}

    if "positive" not in summary:
        return {
            "valid": False,
            "validator": "review_sentiment",
            "error": "리뷰 요약에 positive 항목이 없습니다",
        }
    if "negative" not in summary:
        return {
            "valid": False,
            "validator": "review_sentiment",
            "error": "리뷰 요약에 negative 항목이 없습니다",
        }
    return {"valid": True, "validator": "review_sentiment"}
