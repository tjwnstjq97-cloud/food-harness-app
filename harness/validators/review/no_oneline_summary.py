"""no_oneline_summary validator (Phase 27)
사용자가 명시적으로 거절한 '한 줄 리뷰 요약' 기능이 재도입되지 않도록 코드베이스를 스캔한다.

근거:
  - docs/handoff.md "Work To Avoid" 항목
  - proposed_features.md "🚫 거절 이력" 항목
  - 사용자 발언 (2026-04-23): "보고 싶지 않다"

탐지 대상 (대소문자 무관):
  - oneLineSummary / one_line_summary
  - summarizeReview / summarize_review
  - reviewSummaryText / review_summary_text
  - 한 줄 요약 (한국어 주석/문자열 리터럴)

허용 패턴 (오탐 방지):
  - ReviewSummary 타입은 totalCount/averageRating 등 통계용이므로 제외
  - buildHighlights, ReviewHighlight (키워드 칩은 허용)
"""

import os
import re

FORBIDDEN_PATTERNS = [
    re.compile(r"\boneLineSummary\b", re.IGNORECASE),
    re.compile(r"\bone_line_summary\b", re.IGNORECASE),
    re.compile(r"\bsummarizeReview\b", re.IGNORECASE),
    re.compile(r"\bsummarize_review\b", re.IGNORECASE),
    re.compile(r"\breviewSummaryText\b", re.IGNORECASE),
    re.compile(r"\breview_summary_text\b", re.IGNORECASE),
    re.compile(r"한\s*줄\s*요약"),
]

# 스캔 대상 확장자
TARGET_EXTS = {".ts", ".tsx", ".js", ".jsx"}

# 무시할 디렉터리
SKIP_DIRS = {"node_modules", ".git", ".expo", "ios", "android", "dist", "build", "supabase/functions"}

# 무시할 파일 (이 validator 자신 + 거절 기록 문서)
SKIP_FILES = {
    "no_oneline_summary.py",
    "proposed_features.md",
    "handoff.md",
    "research.md",
}


def _should_skip_dir(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    return any(p in SKIP_DIRS for p in parts)


def validate(data: dict) -> dict:
    """프로젝트 루트에서 금지 패턴을 검색한다."""
    project_root = data.get("project_root")
    if not project_root or not os.path.isdir(project_root):
        # project_root가 안 주어지면 스킵 (단위 테스트 환경 등)
        return {"valid": True, "validator": "no_oneline_summary"}

    violations = []

    for root, dirs, files in os.walk(project_root):
        # SKIP_DIRS 디렉터리는 walk에서 잘라냄
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if _should_skip_dir(root):
            continue

        for fname in files:
            if fname in SKIP_FILES:
                continue
            ext = os.path.splitext(fname)[1]
            if ext not in TARGET_EXTS:
                continue

            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except OSError:
                continue

            for pat in FORBIDDEN_PATTERNS:
                m = pat.search(content)
                if m:
                    rel = os.path.relpath(fpath, project_root)
                    violations.append(f"{rel}: '{m.group(0)}' 발견")
                    break  # 같은 파일에서 1번만 보고

    if violations:
        return {
            "valid": False,
            "validator": "no_oneline_summary",
            "error": (
                "한 줄 리뷰 요약 패턴이 재도입됐습니다 (사용자 거절 항목). "
                "파일: " + "; ".join(violations[:5])
            ),
        }

    return {"valid": True, "validator": "no_oneline_summary"}
