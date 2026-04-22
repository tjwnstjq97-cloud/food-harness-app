"""region_logic validator
region 필드가 없거나 KR/GLOBAL 외의 값이면 실패를 반환한다.
"""

VALID_REGIONS = {"KR", "GLOBAL"}


def validate(data: dict) -> dict:
    """region 필드의 존재 여부와 유효성을 검사한다."""
    region = data.get("region")
    if region is None:
        return {
            "valid": False,
            "validator": "region_logic",
            "error": "region 필드가 없습니다",
        }
    if region not in VALID_REGIONS:
        return {
            "valid": False,
            "validator": "region_logic",
            "error": f"유효하지 않은 region: '{region}' (허용값: {VALID_REGIONS})",
        }
    return {"valid": True, "validator": "region_logic"}
