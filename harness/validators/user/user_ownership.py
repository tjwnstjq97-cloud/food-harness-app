"""user_ownership validator
히스토리/즐겨찾기 데이터에 user_id가 없으면 실패.
사용자별 데이터 소유권 분리를 강제한다.
"""


def validate(data: dict) -> dict:
    """히스토리/즐겨찾기에 user_id 존재 여부를 검사한다."""
    history = data.get("history", [])
    for i, item in enumerate(history):
        if "user_id" not in item:
            return {
                "valid": False,
                "validator": "user_ownership",
                "error": f"history[{i}]에 user_id가 없습니다. 소유권 분리 필수",
            }

    favorites = data.get("favorites", [])
    for i, item in enumerate(favorites):
        if "user_id" not in item:
            return {
                "valid": False,
                "validator": "user_ownership",
                "error": f"favorites[{i}]에 user_id가 없습니다. 소유권 분리 필수",
            }

    return {"valid": True, "validator": "user_ownership"}
