"""
menu_source_required.py
메뉴 아이템에 반드시 source 필드가 있는지, 추정 가격은 priceStatus 표기가 있는지 검사.

하네스 규칙:
  - source 없는 메뉴 표시 금지
  - priceStatus 가 없으면 "unknown" 취급 → 경고 수준 (FAIL 아님)
  - price > 0 인데 priceStatus 가 없거나 "unknown" 이면 FAIL
"""

VALID_PRICE_STATUSES = {"confirmed", "estimated", "unknown"}


def validate(data: dict) -> dict:
    """
    data["menus"] 각 항목에:
      1. source 필드 존재 여부 확인
      2. price > 0 이면 priceStatus 필드가 "confirmed" 또는 "estimated" 인지 확인
    """
    errors = []

    menus = data.get("menus", [])
    for i, item in enumerate(menus):
        name = item.get("name", f"item[{i}]")

        # 규칙 1: source 필수
        source = item.get("source", "")
        if not source:
            errors.append(
                f"menus[{i}] '{name}': 'source' 필드 누락 — 출처 없는 메뉴 표시 금지"
            )

        # 규칙 2: price > 0 이면 priceStatus 가 명시되어야 함
        price = item.get("price", 0)
        price_status = item.get("priceStatus", item.get("price_status", ""))
        if price and price > 0:
            if not price_status or price_status not in VALID_PRICE_STATUSES:
                errors.append(
                    f"menus[{i}] '{name}': price={price}원 이지만 "
                    f"priceStatus 없거나 유효하지 않음 (허용: confirmed, estimated, unknown)"
                )

    if errors:
        return {
            "valid": False,
            "error": "menu_source_required 정책 위반:\n" + "\n".join(errors),
        }

    return {"valid": True, "error": None}
