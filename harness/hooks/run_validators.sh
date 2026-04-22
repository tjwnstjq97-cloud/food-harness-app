#!/bin/bash
# run_validators.sh - validator 실행 (실제 동작)
# validators/run_all.py를 호출하여 모든 검증 규칙 실행

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "[VALIDATOR] validator 검증 시작..."

python3 "$PROJECT_ROOT/validators/run_all.py"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "[VALIDATOR] 검증 실패 - 완료 처리 불가"
    exit 1
fi

echo "[VALIDATOR] 모든 검증 통과"
exit 0
