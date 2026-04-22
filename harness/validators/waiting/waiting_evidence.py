"""waiting_evidence validator
웨이팅 정보가 있을 때 근거(evidence)가 없으면
estimated 플래그가 True여야 한다. 둘 다 없으면 실패.
"""


def validate(data: dict) -> dict:
    """웨이팅 정보의 근거 유무를 검사한다."""
    waiting = data.get("waiting")
    if waiting is None:
        return {"valid": True, "validator": "waiting_evidence"}

    has_evidence = bool(waiting.get("evidence"))
    is_estimated = waiting.get("estimated", False)

    if not has_evidence and not is_estimated:
        return {
            "valid": False,
            "validator": "waiting_evidence",
            "error": "웨이팅 정보에 근거(evidence)가 없으면 estimated: true 필수",
        }
    return {"valid": True, "validator": "waiting_evidence"}
