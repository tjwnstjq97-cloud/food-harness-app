"""env_access validator
소스코드에서 .env 파일을 직접 읽거나 파싱하는 코드를 탐지한다.
.env는 런타임 환경변수로만 접근해야 하며, 코드에서 직접 파일을 열면 안 된다.
harness/, node_modules, 설정 파일 등은 스캔 제외.
"""

import os
import re

SCAN_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py"}

SKIP_DIRS = {"node_modules", ".expo", ".git", "harness", "__pycache__", "dist"}

# .env 직접 접근 패턴
ENV_ACCESS_PATTERNS = [
    # JS/TS: fs.readFile('.env'), require('dotenv').config() 등
    (r"""(?:readFile|readFileSync)\s*\(\s*['"].*\.env""", "파일 시스템으로 .env 직접 읽기"),
    (r"""require\s*\(\s*['"]dotenv['"]\s*\)""", "dotenv 패키지 사용 (Expo에서는 EXPO_PUBLIC_ 사용)"),
    (r"""import\s+.*from\s+['"]dotenv['"]""", "dotenv import (Expo에서는 EXPO_PUBLIC_ 사용)"),
    (r"""dotenv\.config\s*\(""", "dotenv.config() 호출"),
    (r"""open\s*\(\s*['"].*\.env""", "Python에서 .env 파일 직접 열기"),
    # .env 파일 경로를 문자열로 참조
    (r"""['"]\.env(?:\.local|\.production)?['"]""", ".env 파일 경로 직접 참조"),
]

# 안전한 예외 (문서, 주석, .gitignore 등)
SAFE_CONTEXT_PATTERNS = [
    r"^\s*#",        # 주석
    r"^\s*//",       # JS 주석
    r"^\s*\*",       # 블록 주석
    r"\.gitignore",  # gitignore 관련
    r"\.env\.example",  # example 파일 참조
    r"SKIP_FILES",   # validator 자체 코드
]


def _is_safe_context(line: str) -> bool:
    """주석이나 안전한 컨텍스트인지 확인한다."""
    for pattern in SAFE_CONTEXT_PATTERNS:
        if re.search(pattern, line):
            return True
    return False


def _scan_file(filepath: str) -> list:
    """파일에서 .env 직접 접근 패턴을 탐지한다."""
    findings = []
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for lineno, line in enumerate(f, 1):
                if _is_safe_context(line):
                    continue
                for pattern, description in ENV_ACCESS_PATTERNS:
                    if re.search(pattern, line, re.IGNORECASE):
                        findings.append({
                            "file": filepath,
                            "line": lineno,
                            "description": description,
                            "content": line.strip()[:80],
                        })
    except (IOError, UnicodeDecodeError):
        pass
    return findings


def validate(data: dict) -> dict:
    """프로젝트 소스코드에서 .env 직접 접근을 스캔한다."""
    project_root = data.get("project_root", "")
    if not project_root or not os.path.isdir(project_root):
        return {"valid": True, "validator": "env_access"}

    all_findings = []
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            ext = os.path.splitext(filename)[1]
            if ext not in SCAN_EXTENSIONS:
                continue
            filepath = os.path.join(root, filename)
            findings = _scan_file(filepath)
            all_findings.extend(findings)

    if all_findings:
        first = all_findings[0]
        rel_path = os.path.relpath(first["file"], project_root)
        return {
            "valid": False,
            "validator": "env_access",
            "error": (
                f".env 직접 접근 탐지: {rel_path}:{first['line']} "
                f"→ {first['description']}"
            ),
            "findings": all_findings,
        }

    return {"valid": True, "validator": "env_access"}
