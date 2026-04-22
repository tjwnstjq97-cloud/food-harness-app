"""required_fields validator
필수 키가 누락되면 실패를 반환한다.
"""

REQUIRED_KEYS = ["name", "region", "category"]


def validate(data: dict) -> dict:
    """데이터에서 필수 필드 존재 여부를 검사한다."""
    missing = [key for key in REQUIRED_KEYS if key not in data]
    if missing:
        return {
            "valid": False,
            "validator": "required_fields",
            "error": f"필수 필드 누락: {', '.join(missing)}",
        }
    return {"valid": True, "validator": "required_fields"}
