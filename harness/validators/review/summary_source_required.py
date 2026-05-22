"""summary_source_required validator

AI 자동 요약 결과(review_summary_v2)에는 sources 배열이 비어있으면 안 된다.
하네스 규칙: "리뷰 출처(source) 없이 요약 금지" — 자동 요약도 동일 규칙 적용.

검사 대상 키:
  data["review_summary_v2"] = {
    "positivePoints": [...],
    "negativePoints": [...],
    "totalReviewCount": int,
    "sources": [{"type": "naver_blog", "count": 5, "urls": [...]}, ...],
    "generatedAt": "..."
  }

검사 규칙:
  - 키 자체가 없으면 통과 (요약 미생성 상태 — 별도 단계의 책임)
  - 요약이 있는데 totalReviewCount > 0 인데 sources가 비었으면 실패
  - sources 항목에 type/count 누락이면 실패
  - waitingSignal이 있으면 label/evidence/sourceCount가 있어야 함
  - waitingSignal은 리뷰 근거 기반 추정이므로 sources가 비어있으면 실패
  - positivePoints/negativePoints 둘 다 비었는데 totalReviewCount > 0 인 경우는
    Anthropic이 추출에 실패한 케이스 — 경고지만 통과 (별도 모니터링 영역)
"""


def validate(data: dict) -> dict:
    summary = data.get("review_summary_v2")
    if summary is None:
        return {"valid": True, "validator": "summary_source_required"}

    if not isinstance(summary, dict):
        return {
            "valid": False,
            "validator": "summary_source_required",
            "error": "review_summary_v2는 객체여야 합니다",
        }

    total = summary.get("totalReviewCount", 0)
    sources = summary.get("sources", [])
    waiting_signal = summary.get("waitingSignal")

    # 리뷰 0건이면 sources 비어도 OK
    if total == 0 and waiting_signal in (None, {}):
        return {"valid": True, "validator": "summary_source_required"}

    if not isinstance(sources, list) or len(sources) == 0:
        return {
            "valid": False,
            "validator": "summary_source_required",
            "error": (
                f"review_summary_v2.sources가 비어있는데 totalReviewCount={total}. "
                "하네스 규칙: 출처 없이 요약 금지."
            ),
        }

    for i, src in enumerate(sources):
        if not isinstance(src, dict):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": f"sources[{i}]는 객체여야 합니다",
            }
        if "type" not in src or not src.get("type"):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": f"sources[{i}]에 type이 없습니다",
            }
        if "count" not in src:
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": f"sources[{i}]에 count가 없습니다",
            }
        if not isinstance(src.get("count"), int) or src.get("count") <= 0:
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": f"sources[{i}].count는 1 이상의 정수여야 합니다",
            }

    if waiting_signal not in (None, {}):
        if not isinstance(waiting_signal, dict):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal은 객체 또는 null이어야 합니다",
            }
        if not waiting_signal.get("label"):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal.label이 없습니다",
            }
        if not waiting_signal.get("evidence"):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal.evidence가 없습니다. 웨이팅 추정은 근거 필수입니다",
            }
        if (
            not isinstance(waiting_signal.get("sourceCount"), int)
            or waiting_signal.get("sourceCount") <= 0
        ):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal.sourceCount는 1 이상의 정수여야 합니다",
            }
        min_minutes = waiting_signal.get("minMinutes")
        max_minutes = waiting_signal.get("maxMinutes")
        if min_minutes is not None and (
            not isinstance(min_minutes, int) or min_minutes < 0
        ):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal.minMinutes는 0 이상의 정수여야 합니다",
            }
        if max_minutes is not None and (
            not isinstance(max_minutes, int) or max_minutes < 0
        ):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal.maxMinutes는 0 이상의 정수여야 합니다",
            }
        if (
            isinstance(min_minutes, int)
            and isinstance(max_minutes, int)
            and max_minutes < min_minutes
        ):
            return {
                "valid": False,
                "validator": "summary_source_required",
                "error": "waitingSignal.maxMinutes는 minMinutes보다 작을 수 없습니다",
            }

    return {"valid": True, "validator": "summary_source_required"}
