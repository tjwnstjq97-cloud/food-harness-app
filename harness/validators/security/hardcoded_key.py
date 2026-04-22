"""hardcoded_key validator
소스코드에서 하드코딩된 API Key / Secret / Token을 탐지한다.
.env, node_modules, harness/ 등은 스캔 대상에서 제외한다.
"""

import os
import re

# 스캔 대상 확장자
SCAN_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".json", ".py"}

# 스캔 제외 디렉토리
SKIP_DIRS = {"node_modules", ".expo", ".git", "harness", "__pycache__", "dist"}

# 스캔 제외 파일
SKIP_FILES = {".env.example", "package-lock.json"}

# 탐지 패턴: 실제 키 값이 할당된 경우만 잡음 (placeholder/빈 값 제외)
PATTERNS = [
    # 일반적인 API Key 패턴 (sk-, key-, AIza 등으로 시작하는 긴 문자열)
    (r"""(?:api[_-]?key|apikey)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]""", "API_KEY"),
    # Secret 패턴
    (r"""(?:secret|client[_-]?secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{16,})['"]""", "SECRET"),
    # Token 패턴
    (r"""(?:token|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{20,})['"]""", "TOKEN"),
    # Supabase Key 패턴 (eyJ로 시작하는 JWT)
    (r"""['"]eyJ[a-zA-Z0-9_\-]{50,}['"]""", "SUPABASE_KEY(JWT)"),
    # Google API Key (AIza로 시작)
    (r"""['"]AIza[a-zA-Z0-9_\-]{30,}['"]""", "GOOGLE_API_KEY"),
]

# 안전한 패턴 (환경변수 참조, placeholder)
SAFE_PATTERNS = [
    r"process\.env\.",
    r"os\.environ",
    r"your_.*_here",
    r"your-.*-here",
    r"placeholder",
    r"example",
    r"TODO",
]


def _is_safe_line(line: str) -> bool:
    """환경변수 참조나 placeholder인 경우 안전으로 판단한다."""
    for pattern in SAFE_PATTERNS:
        if re.search(pattern, line, re.IGNORECASE):
            return True
    return False


def _scan_file(filepath: str) -> list:
    """파일을 읽어 하드코딩된 키를 탐지한다."""
    findings = []
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for lineno, line in enumerate(f, 1):
                if _is_safe_line(line):
                    continue
                for pattern, key_type in PATTERNS:
                    if re.search(pattern, line, re.IGNORECASE):
                        findings.append({
                            "file": filepath,
                            "line": lineno,
                            "type": key_type,
                            "content": line.strip()[:80],
                        })
    except (IOError, UnicodeDecodeError):
        pass
    return findings


def validate(data: dict) -> dict:
    """프로젝트 소스코드에서 하드코딩된 API Key를 스캔한다."""
    project_root = data.get("project_root", "")
    if not project_root or not os.path.isdir(project_root):
        return {"valid": True, "validator": "hardcoded_key"}

    all_findings = []
    for root, dirs, files in os.walk(project_root):
        # 제외 디렉토리 스킵
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            if filename in SKIP_FILES:
                continue
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
            "validator": "hardcoded_key",
            "error": (
                f"하드코딩된 {first['type']} 탐지: "
                f"{rel_path}:{first['line']} → {first['content']}"
            ),
            "findings": all_findings,
        }

    return {"valid": True, "validator": "hardcoded_key"}
