#!/bin/bash
# ci_local.sh - 로컬 CI: lint -> test -> validator 순서 실행
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "로컬 CI 실행"
echo "=========================================="

echo ""
echo "[1/3] 린트 검사"
bash "$PROJECT_ROOT/hooks/run_lint.sh"

echo ""
echo "[2/3] 테스트 실행"
bash "$PROJECT_ROOT/hooks/run_tests.sh"

echo ""
echo "[3/3] Validator 검증"
bash "$PROJECT_ROOT/hooks/run_validators.sh"

echo ""
echo "=========================================="
echo "로컬 CI 완료 - 모두 통과"
echo "=========================================="
