"""console_debug validator
프로덕션 소스코드에 console.log 등 디버그 로그가 남아있으면 경고한다.
console.warn, console.error는 의도적일 수 있으므로 허용.
"""

import os
import re

DEBUG_PATTERNS = [
    re.compile(r"\bconsole\.log\b"),
    re.compile(r"\bconsole\.debug\b"),
    re.compile(r"\bconsole\.trace\b"),
]

SKIP_DIRS = {"node_modules", ".expo", ".git", "harness", "__pycache__", "dist"}
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# 허용 파일 (설정 파일, 테스트 등)
ALLOW_FILES = {"metro.config.js", "babel.config.js", "jest.config.js"}


def validate(data: dict) -> dict:
    """소스 파일에서 console.log/debug/trace 사용을 탐지한다."""
    project_root = data.get("project_root", ".")
    issues = []

    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if fname in ALLOW_FILES:
                continue
            ext = os.path.splitext(fname)[1]
            if ext not in EXTENSIONS:
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, line in enumerate(f, 1):
                        stripped = line.strip()
                        # 주석은 건너뛰기
                        if stripped.startswith("//") or stripped.startswith("*"):
                            continue
                        for pattern in DEBUG_PATTERNS:
                            if pattern.search(line):
                                rel = os.path.relpath(fpath, project_root)
                                issues.append(f"{rel}:{line_no}")
                                break
            except (OSError, UnicodeDecodeError):
                continue

    if issues:
        return {
            "valid": False,
            "validator": "console_debug",
            "error": f"디버그 로그 잔존 ({len(issues)}건): {', '.join(issues[:5])}",
        }
    return {"valid": True, "validator": "console_debug"}
