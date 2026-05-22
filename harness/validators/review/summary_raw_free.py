"""summary_raw_free validator

review_summary_v2는 UI/로그/캐시에 그대로 노출될 수 있는 데이터다.
따라서 raw provider 응답(body), LLM prompt/messages, credential/secret 같은
민감 원문이 섞여 들어가는 것을 하네스 단계에서 차단한다.

목표(자동작업 우선순위 #3):
  - raw provider body/prompt/credential/개인 데이터가 화면/log/cache에 노출되지 않도록
    source-backed summary contract를 "raw-free"로 고정한다.

검사 규칙(보수적):
  - review_summary_v2가 없으면 통과
  - summary 내부/하위 객체의 key 중 위험 키워드가 있으면 실패
  - summary 문자열 값에 secret/credential로 강하게 의심되는 패턴이 있으면 실패
  - 요약 텍스트 필드(positivePoints/negativePoints/evidence)는 과도하게 길면 실패
    (긴 원문 덤프/HTML/JSON 덩어리 유입 방지)
"""

from __future__ import annotations

import re
from typing import Any, Iterable


DISALLOWED_KEY_SUBSTRINGS = [
    # provider raw
    "raw",
    "body",
    "content",
    "html",
    "payload",
    "response",
    "request",
    "headers",
    "cookie",
    # llm prompt/messages
    "prompt",
    "messages",
    "system",
    "assistant",
    "tool",
    # credentials/secrets
    "authorization",
    "apikey",
    "api_key",
    "service_role",
    "servicerole",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "password",
]

# 강한 신호 위주로만 잡는다 (과탐 최소화)
DISALLOWED_VALUE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bsk-[A-Za-z0-9]{10,}\b"),  # OpenAI/Stripe류 키 패턴(일반화)
    re.compile(r"\bservice_role\b", re.IGNORECASE),
    re.compile(r"\bBearer\s+[A-Za-z0-9._-]{10,}\b"),
    re.compile(r"\bAuthorization\s*:\s*", re.IGNORECASE),
    re.compile(r"\bx-api-key\b", re.IGNORECASE),
    # PII (보수적): 요약/대표리뷰에 개인 식별/연락처가 섞여 들어오는 것을 차단
    re.compile(r"\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,}\b"),
    re.compile(r"\b(?:\+?82[-.\s]?)?(?:0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}\b"),
    # URL query에 token/secret이 실리는 경우(보수적 키워드 기반)
    re.compile(r"[?&](?:access_token|refresh_token|api_key|apikey|token|secret)=", re.IGNORECASE),
]

MAX_POINT_LEN = 220
MAX_EVIDENCE_LEN = 360
MAX_REPRESENTATIVE_REVIEW_LEN = 420


def _iter_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
        return
    if isinstance(value, dict):
        for k, v in value.items():
            # key도 문자열로 스캔하여 "Authorization" 같은 강한 신호를 잡을 수 있음
            if isinstance(k, str):
                yield k
            yield from _iter_strings(v)
        return
    if isinstance(value, list):
        for v in value:
            yield from _iter_strings(v)
        return


def _has_disallowed_key(obj: Any, path: str = "review_summary_v2") -> str | None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(k, str):
                lowered = k.lower().replace("-", "_")
                for bad in DISALLOWED_KEY_SUBSTRINGS:
                    if bad in lowered:
                        return f"{path}.{k}"
            child_path = f"{path}.{k}" if isinstance(k, str) else path
            found = _has_disallowed_key(v, child_path)
            if found:
                return found
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            found = _has_disallowed_key(v, f"{path}[{i}]")
            if found:
                return found
    return None


def validate(data: dict) -> dict:
    summary = data.get("review_summary_v2")
    if summary is None:
        return {"valid": True, "validator": "summary_raw_free"}

    if not isinstance(summary, dict):
        return {
            "valid": False,
            "validator": "summary_raw_free",
            "error": "review_summary_v2는 객체여야 합니다",
        }

    disallowed_key_path = _has_disallowed_key(summary)
    if disallowed_key_path:
        return {
            "valid": False,
            "validator": "summary_raw_free",
            "error": (
                f"review_summary_v2에 raw/prompt/credential로 의심되는 키가 포함됨: {disallowed_key_path}. "
                "하네스 규칙: raw provider body/prompt/credential/PII 노출 금지."
            ),
        }

    # 길이 기반 가드: 원문 덤프 유입 방지
    for field, max_len in [
        ("positivePoints", MAX_POINT_LEN),
        ("negativePoints", MAX_POINT_LEN),
    ]:
        items = summary.get(field, [])
        if isinstance(items, list):
            for i, item in enumerate(items):
                if isinstance(item, str) and len(item) > max_len:
                    return {
                        "valid": False,
                        "validator": "summary_raw_free",
                        "error": f"{field}[{i}]가 너무 깁니다({len(item)}자). 원문 덤프/HTML/JSON 유입 가능.",
                    }

    waiting = summary.get("waitingSignal")
    if isinstance(waiting, dict):
        evidence = waiting.get("evidence")
        if isinstance(evidence, str) and len(evidence) > MAX_EVIDENCE_LEN:
            return {
                "valid": False,
                "validator": "summary_raw_free",
                "error": f"waitingSignal.evidence가 너무 깁니다({len(evidence)}자). 원문 덤프 유입 가능.",
            }

    reps = summary.get("representativeReviews")
    if isinstance(reps, list):
        for i, rep in enumerate(reps):
            if isinstance(rep, dict):
                text = rep.get("text")
                if isinstance(text, str) and len(text) > MAX_REPRESENTATIVE_REVIEW_LEN:
                    return {
                        "valid": False,
                        "validator": "summary_raw_free",
                        "error": f"representativeReviews[{i}].text가 너무 깁니다({len(text)}자). 원문 덤프 유입 가능.",
                    }

    # 값 패턴 스캔: secret/credential 강한 신호만
    for s in _iter_strings(summary):
        for pat in DISALLOWED_VALUE_PATTERNS:
            if pat.search(s):
                return {
                    "valid": False,
                    "validator": "summary_raw_free",
                    "error": "review_summary_v2 값에서 secret/credential 패턴이 탐지되었습니다. raw 노출 금지.",
                }

    return {"valid": True, "validator": "summary_raw_free"}
