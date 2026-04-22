"""service_role_key validator
Supabase service_role 키가 클라이언트 코드에 노출되는지 탐지한다.
service_role 키는 서버에서만 사용해야 하며, 클라이언트에 있으면 DB 전체 접근이 가능해진다.
"""

import os
import re

SCAN_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
SKIP_DIRS = {"node_modules", ".expo", ".git", "harness", "__pycache__", "dist", "supabase"}

# service_role 키는 보통 eyJ로 시작하는 긴 JWT이며,
# "service_role" 또는 "SERVICE_ROLE" 문자열 근처에 있음
SERVICE_ROLE_PATTERNS = [
    r"service[_-]?role",
    r"SUPABASE_SERVICE_ROLE",
    r"supabaseServiceRole",
]

# 안전한 컨텍스트
SAFE_PATTERNS = [
    r"^\s*//",       # 주석
    r"^\s*\*",       # 블록 주석
    r"\.env",        # .env 참조
    r"process\.env", # 환경변수 참조
]


def _is_safe(line: str) -> bool:
    for p in SAFE_PATTERNS:
        if re.search(p, line):
            return True
    return False


def validate(data: dict) -> dict:
    """클라이언트 소스에서 service_role 키 참조를 탐지한다."""
    project_root = data.get("project_root", "")
    if not project_root or not os.path.isdir(project_root):
        return {"valid": True, "validator": "service_role_key"}

    # 클라이언트 코드만 스캔 (src/, app/)
    scan_dirs = [
        os.path.join(project_root, "src"),
        os.path.join(project_root, "app"),
    ]

    findings = []
    for scan_dir in scan_dirs:
        if not os.path.isdir(scan_dir):
            continue
        for root, dirs, files in os.walk(scan_dir):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for filename in files:
                ext = os.path.splitext(filename)[1]
                if ext not in SCAN_EXTENSIONS:
                    continue
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        for lineno, line in enumerate(f, 1):
                            if _is_safe(line):
                                continue
                            for pattern in SERVICE_ROLE_PATTERNS:
                                if re.search(pattern, line, re.IGNORECASE):
                                    findings.append({
                                        "file": filepath,
                                        "line": lineno,
                                        "content": line.strip()[:80],
                                    })
                except (IOError, UnicodeDecodeError):
                    pass

    if findings:
        first = findings[0]
        rel_path = os.path.relpath(first["file"], project_root)
        return {
            "valid": False,
            "validator": "service_role_key",
            "error": (
                f"service_role 키가 클라이언트 코드에서 발견됨: "
                f"{rel_path}:{first['line']}. 서버에서만 사용하세요."
            ),
            "findings": findings,
        }

    return {"valid": True, "validator": "service_role_key"}
