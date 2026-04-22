"""reservation_check validator
reservation 객체가 있을 때 link가 없으면 실패를 반환한다.
"""


def validate(data: dict) -> dict:
    """예약 정보가 있으면 link 필드 존재 여부를 검사한다."""
    reservation = data.get("reservation")
    if reservation is None:
        return {"valid": True, "validator": "reservation_check"}

    if "link" not in reservation or not reservation["link"]:
        return {
            "valid": False,
            "validator": "reservation_check",
            "error": "reservation에 link가 없습니다. 예약 링크 없이는 '정보 없음' 처리 필요",
        }
    return {"valid": True, "validator": "reservation_check"}
