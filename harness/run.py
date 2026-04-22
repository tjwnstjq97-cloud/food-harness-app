#!/usr/bin/env python3
"""
harness/run.py — 에이전틱 실행기 (EXPERIMENTAL)

⚠️  EXPERIMENTAL: claude CLI(`claude -p`) 기반 자동화 실행기.
    claude CLI 설치 및 인증이 필요하다.

사용법:
    python3 harness/run.py                     # research.md 기반 자동 실행
    python3 harness/run.py "특정 지시사항"      # 직접 지시사항 주입
    python3 harness/run.py --dry-run           # 실제 실행 없이 프롬프트만 확인
    python3 harness/run.py --max-retries 2     # 재시도 횟수 지정 (기본 3)

전제조건:
    1. claude CLI 설치: npm install -g @anthropic-ai/claude-code
    2. API 키 설정: ANTHROPIC_API_KEY 환경변수 (또는 claude login)
    3. 프로젝트 루트에서 실행: python3 harness/run.py

개선된 기능 (harness_framework-main 흡수):
    - progress_indicator: 스레드 기반 스피너 + 경과시간 표시
    - retry + 에러 피드백: 실패 시 이전 에러 원인을 다음 프롬프트에 주입
    - blocked 상태: API키/수동작업 필요 시 즉시 중단 + 안내
    - --dangerously-skip-permissions: claude 자율 실행 모드
    - --output-format json: 구조화된 출력 파싱
    - 타임스탬프 기록: 실행 시작/종료/소요시간 출력
"""

import contextlib
import json
import subprocess
import sys
import shutil
import threading
import time
import types
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── 상수 ──────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
RESEARCH_MD  = PROJECT_ROOT / "research.md"
FAILED_TASKS_MD = PROJECT_ROOT / "docs" / "failed_tasks.md"
VALIDATORS_SCRIPT = PROJECT_ROOT / "harness" / "validators" / "run_all.py"
CLAUDE_MD    = PROJECT_ROOT / "CLAUDE.md"
DOCS_DIR     = PROJECT_ROOT / "docs"

MAX_RETRIES_DEFAULT = 3
CLAUDE_TIMEOUT = 1800  # 30분
KST = timezone(timedelta(hours=9))

EXPERIMENTAL_NOTICE = """
╔══════════════════════════════════════════════════════════╗
║  ⚠️  EXPERIMENTAL — harness/run.py                      ║
║  claude CLI 기반 자동화 실행기                           ║
║  실제 API 호출 및 파일 수정이 발생합니다.                ║
╚══════════════════════════════════════════════════════════╝
"""

SYSTEM_PROMPT = """당신은 food-harness-app 프로젝트를 담당하는 에이전트입니다.

핵심 원칙:
- CLAUDE.md 규칙을 항상 준수합니다.
- 모든 작업 전/후에 harness/validators/run_all.py 를 실행해 검증합니다.
- console.log/debug/trace 사용 금지 (console.info 허용).
- API Key 하드코딩 절대 금지.
- region 분기(KR/GLOBAL) 없이 지도/검색 구현 금지.
- 작업 내역은 반드시 research.md 에 기록합니다.
- 불확실한 것은 TODO로 남기고 추측하지 않습니다.
- API키 / 외부 인증 / 수동 설정이 필요하면 즉시 [BLOCKED: <사유>] 를 출력하고 중단합니다.

작업 순서:
1. research.md 상단 대시보드 확인
2. docs/failed_tasks.md 실패 항목 확인
3. FAILED TASK 있으면 그것부터, 없으면 우선순위 순서로 진행
4. 각 TASK 완료 후 validator 실행 (python3 harness/validators/run_all.py)
5. 모두 통과하면 research.md 업데이트
"""


# ── 유틸리티 ──────────────────────────────────────────────────────────────────

def stamp() -> str:
    """KST 타임스탬프 반환."""
    return datetime.now(KST).strftime("%Y-%m-%dT%H:%M:%S%z")


@contextlib.contextmanager
def progress_indicator(label: str):
    """
    터미널 진행 표시기 (harness_framework-main에서 흡수).
    with 문으로 사용하며 .elapsed 로 경과 시간(초)을 읽는다.
    """
    frames = "◐◓◑◒"
    stop = threading.Event()
    t0 = time.monotonic()

    def _animate():
        idx = 0
        while not stop.wait(0.12):
            sec = int(time.monotonic() - t0)
            sys.stderr.write(f"\r{frames[idx % len(frames)]} {label} [{sec}s]  ")
            sys.stderr.flush()
            idx += 1
        sys.stderr.write("\r" + " " * (len(label) + 20) + "\r")
        sys.stderr.flush()

    th = threading.Thread(target=_animate, daemon=True)
    th.start()
    info = types.SimpleNamespace(elapsed=0.0)
    try:
        yield info
    finally:
        stop.set()
        th.join()
        info.elapsed = time.monotonic() - t0


def read_file_safe(path: Path, max_chars: int = 0) -> str:
    """파일을 읽어 반환. 없으면 빈 문자열."""
    try:
        text = path.read_text(encoding="utf-8")
        return text[:max_chars] if max_chars else text
    except FileNotFoundError:
        return ""


def find_claude_cli():
    """claude CLI 실행 파일 경로 탐색. 없으면 None."""
    return shutil.which("claude")


# ── 가드레일 로딩 (harness_framework-main 패턴) ───────────────────────────────

def load_guardrails() -> str:
    """
    CLAUDE.md + docs/*.md 내용을 모아 가드레일 문자열 반환.
    execute.py의 _load_guardrails() 패턴 적용.
    """
    sections = []
    if CLAUDE_MD.exists():
        sections.append(f"## 프로젝트 규칙 (CLAUDE.md)\n\n{CLAUDE_MD.read_text()}")
    if DOCS_DIR.is_dir():
        for doc in sorted(DOCS_DIR.glob("*.md")):
            sections.append(f"## {doc.stem}\n\n{doc.read_text()[:2000]}")
    return "\n\n---\n\n".join(sections) if sections else ""


def build_prompt(user_instruction: str, prev_error: str = "") -> str:
    """
    research.md + failed_tasks.md + guardrails 를 묶어 최종 프롬프트 생성.
    prev_error 가 있으면 재시도 섹션 추가 (harness_framework-main 패턴).
    """
    research = read_file_safe(RESEARCH_MD, max_chars=4000)
    failed   = read_file_safe(FAILED_TASKS_MD, max_chars=2000)
    guardrails = load_guardrails()

    context_parts = []
    if research:
        context_parts.append(f"## research.md 현재 상태\n\n{research}")
    if failed:
        context_parts.append(f"## docs/failed_tasks.md\n\n{failed}")
    context = "\n\n---\n\n".join(context_parts)

    retry_section = ""
    if prev_error:
        retry_section = (
            f"\n## ⚠ 이전 시도 실패 — 아래 에러를 반드시 참고하여 수정하라\n\n"
            f"{prev_error}\n\n---\n\n"
        )

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"---\n\n"
        f"{guardrails}\n\n"
        f"---\n\n"
        f"{context}\n\n"
        f"---\n\n"
        f"{retry_section}"
        f"## 지시사항\n\n"
        f"{user_instruction}\n"
    )


# ── Validator ─────────────────────────────────────────────────────────────────

def run_validators(silent: bool = False) -> bool:
    """validator 전체 실행 후 성공 여부 반환."""
    result = subprocess.run(
        [sys.executable, str(VALIDATORS_SCRIPT)],
        cwd=PROJECT_ROOT,
        capture_output=silent,
    )
    return result.returncode == 0


# ── Claude 호출 ───────────────────────────────────────────────────────────────

def invoke_claude(prompt: str, dry_run: bool = False, skip_permissions: bool = True):
    """
    claude CLI를 subprocess로 호출한다.

    개선사항 (harness_framework-main 흡수):
      - --dangerously-skip-permissions 옵션 지원
      - --output-format json 으로 구조화된 출력
      - timeout=1800 (30분)
      - stdout을 캡처해 BLOCKED 패턴 감지

    반환값: {"exitCode": int, "stdout": str, "stderr": str, "blocked": bool, "blocked_reason": str}
    """
    if dry_run:
        print("\n── DRY RUN: 실제 실행 없음 ──")
        print(f"프롬프트 미리보기 (앞 600자):\n{prompt[:600]}\n...")
        return {"exitCode": 0, "stdout": "", "stderr": "", "blocked": False, "blocked_reason": ""}

    cli_path = find_claude_cli()
    if cli_path:
        cmd = [cli_path, "-p", prompt, "--output-format", "json"]
        if skip_permissions:
            cmd.append("--dangerously-skip-permissions")
    else:
        npx = shutil.which("npx")
        if not npx:
            print("❌ claude CLI 또는 npx를 찾을 수 없습니다.")
            print("   설치: npm install -g @anthropic-ai/claude-code")
            return {"exitCode": 1, "stdout": "", "stderr": "", "blocked": False, "blocked_reason": ""}
        cmd = [npx, "@anthropic-ai/claude-code", "-p", prompt, "--output-format", "json"]
        if skip_permissions:
            cmd.append("--dangerously-skip-permissions")

    result = subprocess.run(
        cmd,
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        timeout=CLAUDE_TIMEOUT,
    )

    # BLOCKED 패턴 감지
    blocked = False
    blocked_reason = ""
    output_text = result.stdout + result.stderr
    if "[BLOCKED:" in output_text:
        blocked = True
        start = output_text.find("[BLOCKED:") + len("[BLOCKED:")
        end   = output_text.find("]", start)
        blocked_reason = output_text[start:end].strip() if end > start else "이유 미기록"

    return {
        "exitCode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "blocked": blocked,
        "blocked_reason": blocked_reason,
    }


# ── 메인 실행 루프 ────────────────────────────────────────────────────────────

def run_with_retry(
    instruction: str,
    dry_run: bool = False,
    max_retries: int = MAX_RETRIES_DEFAULT,
    skip_permissions: bool = True,
) -> int:
    """
    claude를 실행하고 실패 시 재시도한다 (최대 max_retries회).
    harness_framework-main execute.py 의 _execute_single_step 패턴 적용.

    - 성공: exit code 0
    - blocked: exit code 2  (blocked_tasks.md 안내)
    - 실패(3회 초과): exit code 1
    """
    prev_error = ""

    for attempt in range(1, max_retries + 1):
        prompt = build_prompt(instruction, prev_error=prev_error)

        tag = f"claude 실행 중 (attempt {attempt}/{max_retries})"
        with progress_indicator(tag) as pi:
            output = invoke_claude(prompt, dry_run=dry_run, skip_permissions=skip_permissions)
            elapsed = int(pi.elapsed)

        if dry_run:
            return 0

        # blocked 감지
        if output["blocked"]:
            print(f"\n⏸  BLOCKED [{elapsed}s]: {output['blocked_reason']}")
            print("  → 사용자 개입 필요. 처리 후 다시 실행하세요.")
            _append_blocked_record(instruction, output["blocked_reason"])
            return 2

        exit_code = output["exitCode"]

        # 성공
        if exit_code == 0:
            print(f"\n✓ 완료 [{elapsed}s] (attempt {attempt})")
            return 0

        # 실패 → 다음 재시도 준비
        stderr_snippet = output["stderr"][:500] if output["stderr"] else "(stderr 없음)"
        prev_error = f"exit code={exit_code}\n{stderr_snippet}"

        if attempt < max_retries:
            print(f"\n↻ 실패 (attempt {attempt}/{max_retries}) [{elapsed}s] — 재시도 중...")
            print(f"  에러: {stderr_snippet[:200]}")
        else:
            print(f"\n✗ {max_retries}회 시도 후 최종 실패 [{elapsed}s]")
            print(f"  에러: {stderr_snippet[:300]}")
            _append_failed_record(instruction, prev_error)

    return 1


def _append_failed_record(instruction: str, error: str):
    """failed_tasks.md에 실패 기록 추가."""
    ts = stamp()
    entry = (
        f"\n## [자동기록] run.py 실행 실패 — {ts}\n"
        f"- Status: FAILED\n"
        f"- Failed At: {ts}\n"
        f"- Retry Count: {MAX_RETRIES_DEFAULT}\n"
        f"- Instruction: {instruction[:200]}\n"
        f"- Error Detail:\n```\n{error[:400]}\n```\n"
        f"- Suggested Fix: 에러 내용 확인 후 `python3 harness/run.py \"<수정된 지시사항\"` 재실행\n"
    )
    try:
        with open(FAILED_TASKS_MD, "a", encoding="utf-8") as f:
            f.write(entry)
        print(f"  → docs/failed_tasks.md에 기록됨")
    except Exception as e:
        print(f"  WARN: failed_tasks.md 기록 실패: {e}")


def _append_blocked_record(instruction: str, reason: str):
    """blocked 상태를 failed_tasks.md에 기록."""
    ts = stamp()
    entry = (
        f"\n## [BLOCKED] run.py 실행 차단 — {ts}\n"
        f"- Status: BLOCKED\n"
        f"- Blocked At: {ts}\n"
        f"- Blocked Reason: {reason}\n"
        f"- Instruction: {instruction[:200]}\n"
        f"- Resume Hint: 차단 사유 해결 후 재실행\n"
    )
    try:
        with open(FAILED_TASKS_MD, "a", encoding="utf-8") as f:
            f.write(entry)
        print(f"  → docs/failed_tasks.md에 BLOCKED 기록됨")
    except Exception as e:
        print(f"  WARN: failed_tasks.md 기록 실패: {e}")


def main():
    print(EXPERIMENTAL_NOTICE)

    args = sys.argv[1:]
    dry_run         = "--dry-run" in args
    skip_perms      = "--no-skip-permissions" not in args
    raw_args        = [a for a in args if not a.startswith("--")]

    # --max-retries N 파싱
    max_retries = MAX_RETRIES_DEFAULT
    if "--max-retries" in args:
        idx = args.index("--max-retries")
        try:
            max_retries = int(args[idx + 1])
        except (IndexError, ValueError):
            print("WARN: --max-retries 값이 올바르지 않음. 기본값(3) 사용.")

    # 지시사항
    instruction = (
        " ".join(raw_args)
        if raw_args else
        "research.md와 docs/failed_tasks.md를 읽고 현재 상태를 복구한 뒤, "
        "FAILED된 TASK부터 가능한 한 많이 자동으로 진행해. "
        "각 TASK 완료 후 validator를 실행해 검증하고 research.md를 업데이트해."
    )

    start_ts = stamp()
    print(f"  시작: {start_ts}")
    print(f"  max-retries: {max_retries} | skip-permissions: {skip_perms}\n")

    # ── 사전 validator ──
    print("▶  [1/3] validator 사전 검증...\n")
    pre_ok = run_validators()
    if not pre_ok:
        print("⚠️  validator 실패 상태에서 시작합니다. claude에게 수정을 요청합니다.\n")

    # ── claude 실행 ──
    print("▶  [2/3] claude 실행...\n")
    exit_code = run_with_retry(
        instruction,
        dry_run=dry_run,
        max_retries=max_retries,
        skip_permissions=skip_perms,
    )

    # ── 사후 validator ──
    if not dry_run:
        print("\n▶  [3/3] validator 사후 검증...\n")
        post_ok = run_validators()
        end_ts = stamp()
        print(f"\n  종료: {end_ts}")
        if post_ok:
            print("✅ 모든 validator 통과")
        else:
            print("❌ validator 실패 — docs/failed_tasks.md 확인 필요")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
