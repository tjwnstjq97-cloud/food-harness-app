"""
restaurant_region_required.py
역정규화 데이터(favorites, history)에 restaurant_region 필드가 반드시 있는지 검사.
region 없이 favorites/history 저장 시 지도 분기 불가 → 하네스 FAIL.
"""

VALID_REGIONS = {"KR", "GLOBAL"}


def validate(data: dict) -> dict:
    """
    data["favorites"] 및 data["history"] 각 항목에
    restaurant_region 필드가 존재하고 유효한지 확인한다.
    """
    errors = []

    # favorites 검사
    favorites = data.get("favorites", [])
    for i, fav in enumerate(favorites):
        region = fav.get("restaurant_region")
        if region is None:
            errors.append(
                f"favorites[{i}]: 'restaurant_region' 필드 누락 "
                f"(restaurant_id={fav.get('restaurant', fav.get('restaurant_id', 'unknown'))})"
            )
        elif region not in VALID_REGIONS:
            errors.append(
                f"favorites[{i}]: 'restaurant_region' 값 '{region}' 유효하지 않음 "
                f"(허용: KR, GLOBAL)"
            )

    # history 검사
    history = data.get("history", [])
    for i, item in enumerate(history):
        region = item.get("restaurant_region")
        if region is None:
            errors.append(
                f"history[{i}]: 'restaurant_region' 필드 누락 "
                f"(restaurant={item.get('restaurant', 'unknown')})"
            )
        elif region not in VALID_REGIONS:
            errors.append(
                f"history[{i}]: 'restaurant_region' 값 '{region}' 유효하지 않음 "
                f"(허용: KR, GLOBAL)"
            )

    if errors:
        return {
            "valid": False,
            "error": "restaurant_region 정책 위반:\n" + "\n".join(errors),
        }

    return {"valid": True, "error": None}
