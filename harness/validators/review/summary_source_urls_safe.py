"""summary_source_urls_safe validator

review_summary_v2.sources.urls 는 UI/로그/캐시에 노출될 수 있는 attribution 데이터다.
따라서 다음을 보수적으로 차단한다:
  - token/secret/apikey 등이 query string에 포함된 URL
  - data: 같은 비정상 스킴
  - http/https 외 스킴
  - 과도하게 긴 URL (원문/덤프 유입 가능)

주의: 실제 외부 호출은 하지 않는다. 문자열만 검증한다.
"""

from __future__ import annotations

import re
from typing import Any

MAX_URL_LEN = 500

DISALLOWED_QUERY_KEYS = [
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "token",
    "secret",
    "authorization",
    "password",
]

DISALLOWED_INLINE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bBearer\s+[A-Za-z0-9._-]{10,}\b", re.IGNORECASE),
    re.compile(r"\bsk-[A-Za-z0-9]{10,}\b"),
]


def _is_http_url(url: str) -> bool:
    lowered = url.lower()
    return lowered.startswith("http://") or lowered.startswith("https://")


def validate(data: dict) -> dict:
    summary = data.get("review_summary_v2")
    if summary is None:
        return {"valid": True, "validator": "summary_source_urls_safe"}

    if not isinstance(summary, dict):
        return {
            "valid": False,
            "validator": "summary_source_urls_safe",
            "error": "review_summary_v2는 객체여야 합니다",
        }

    sources: Any = summary.get("sources", [])
    if not isinstance(sources, list) or len(sources) == 0:
        return {"valid": True, "validator": "summary_source_urls_safe"}

    for i, src in enumerate(sources):
        if not isinstance(src, dict):
            continue
        urls = src.get("urls", [])
        if urls in (None, []):
            continue
        if not isinstance(urls, list):
            return {
                "valid": False,
                "validator": "summary_source_urls_safe",
                "error": f"sources[{i}].urls는 배열이어야 합니다",
            }
        for j, url in enumerate(urls):
            if not isinstance(url, str) or not url.strip():
                return {
                    "valid": False,
                    "validator": "summary_source_urls_safe",
                    "error": f"sources[{i}].urls[{j}]는 비어있지 않은 문자열이어야 합니다",
                }
            if len(url) > MAX_URL_LEN:
                return {
                    "valid": False,
                    "validator": "summary_source_urls_safe",
                    "error": f"sources[{i}].urls[{j}]가 너무 깁니다({len(url)}자). 원문/덤프 유입 가능.",
                }
            lowered = url.lower()
            if lowered.startswith("data:") or lowered.startswith("javascript:"):
                return {
                    "valid": False,
                    "validator": "summary_source_urls_safe",
                    "error": f"sources[{i}].urls[{j}]에 비정상 스킴이 포함됨(data:/javascript:).",
                }
            if not _is_http_url(url):
                return {
                    "valid": False,
                    "validator": "summary_source_urls_safe",
                    "error": f"sources[{i}].urls[{j}]는 http/https URL만 허용됩니다",
                }
            if any(p.search(url) for p in DISALLOWED_INLINE_PATTERNS):
                return {
                    "valid": False,
                    "validator": "summary_source_urls_safe",
                    "error": "sources.urls에서 credential/token으로 의심되는 패턴이 탐지되었습니다",
                }
            # query string에 민감 키가 포함되면 실패
            if "?" in url:
                query = url.split("?", 1)[1]
                for key in DISALLOWED_QUERY_KEYS:
                    if re.search(rf"(^|[&;]){re.escape(key)}=", query, flags=re.IGNORECASE):
                        return {
                            "valid": False,
                            "validator": "summary_source_urls_safe",
                            "error": (
                                f"sources[{i}].urls[{j}] query에 민감 키가 포함됨: {key}. "
                                "하네스 규칙: token/secret 포함 URL 노출 금지."
                            ),
                        }

    return {"valid": True, "validator": "summary_source_urls_safe"}
