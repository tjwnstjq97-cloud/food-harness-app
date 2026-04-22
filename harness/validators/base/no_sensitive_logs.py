"""no_sensitive_logs validator
API_KEY, SECRET, TOKEN 같은 민감 문자열이 데이터에 포함되면 실패를 반환한다.
"""

import json
import re

SENSITIVE_KEYWORDS = ["API_KEY", "SECRET", "TOKEN", "PASSWORD"]

SENSITIVE_PATTERNS = [
    r"API_KEY\s*[:=]\s*['\"]?.+",
    r"SECRET\s*[:=]\s*['\"]?.+",
    r"TOKEN\s*[:=]\s*['\"]?.+",
    r"PASSWORD\s*[:=]\s*['\"]?.+",
]


def validate(data: dict) -> dict:
    """데이터를 문자열로 변환한 뒤 민감 패턴을 검사한다."""
    # 1) 데이터 키에 민감 키워드가 있는지 검사
    for key in data:
        for keyword in SENSITIVE_KEYWORDS:
            if keyword.lower() in key.lower():
                return {
                    "valid": False,
                    "validator": "no_sensitive_logs",
                    "error": f"민감 키 탐지: '{key}'",
                }

    # 2) 값에 민감 패턴이 있는지 검사
    data_str = json.dumps(data, ensure_ascii=False)
    for pattern in SENSITIVE_PATTERNS:
        match = re.search(pattern, data_str, re.IGNORECASE)
        if match:
            return {
                "valid": False,
                "validator": "no_sensitive_logs",
                "error": f"민감 정보 탐지: {match.group(0)[:30]}...",
            }
    return {"valid": True, "validator": "no_sensitive_logs"}
