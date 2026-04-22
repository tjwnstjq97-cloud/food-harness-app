"""pii_in_logs validator
소스코드의 console.log / console.warn / console.error 에서
이메일, 전화번호, 좌표 등 개인정보 패턴을 감지한다.
"""

import os
import re

LOG_PATTERNS = [
    re.compile(r"console\.(log|warn|error|info)\(.*", re.IGNORECASE),
]

PII_PATTERNS = [
    re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),  # 이메일
    re.compile(r"\b01[016789]-?\d{3,4}-?\d{4}\b"),  # 한국 전화번호
    re.compile(r"\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}"),  # 국제 전화번호
    re.compile(r"\b\d{6}-[1-4]\d{6}\b"),  # 주민등록번호
]

SKIP_DIRS = {"node_modules", ".expo", ".git", "harness", "__pycache__", "dist"}
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}


def validate(data: dict) -> dict:
    """소스 파일의 로그 구문에서 PII 패턴을 탐지한다."""
    project_root = data.get("project_root", ".")
    issues = []

    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            ext = os.path.splitext(fname)[1]
            if ext not in EXTENSIONS:
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, line in enumerate(f, 1):
                        is_log = any(p.search(line) for p in LOG_PATTERNS)
                        if not is_log:
                            continue
                        for pii in PII_PATTERNS:
                            if pii.search(line):
                                rel = os.path.relpath(fpath, project_root)
                                issues.append(f"{rel}:{line_no}")
                                break
            except (OSError, UnicodeDecodeError):
                continue

    if issues:
        return {
            "valid": False,
            "validator": "pii_in_logs",
            "error": f"로그에서 개인정보 패턴 감지: {', '.join(issues[:5])}",
        }
    return {"valid": True, "validator": "pii_in_logs"}
