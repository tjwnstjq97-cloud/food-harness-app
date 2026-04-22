# Agentic Workflow — Food Harness App

## 개요

이 프로젝트는 **하네스 엔지니어링**을 기반으로 Claude가 독립 TASK 단위로 작업을 수행하는 에이전틱 워크플로우를 사용한다.

---

## 3계층 에이전틱 레이어

```
┌─────────────────────────────────────────────┐
│ 1. 계획 (Planner)                            │
│  - research.md + failed_tasks.md 읽기        │
│  - 우선순위 판단: FAILED > 구조 > 기능       │
│  - 독립 TASK 단위로 분해                     │
└───────────────────┬─────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. 실행 (Executor)                           │
│  - TASK 단위 코드/문서 생성                  │
│  - 파일 생성 전 구조 검토                   │
│  - .env 절대 수정 금지                       │
│  - API Key 절대 출력 금지                    │
└───────────────────┬─────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. 검토 (Reviewer)                           │
│  - 15개 Python validator 실행 확인           │
│  - research.md 업데이트                      │
│  - 실패 시 최대 3회 재시도                   │
│  - 3회 초과 → failed_tasks.md 기록           │
└─────────────────────────────────────────────┘
```

---

## 커스텀 명령어

| 명령어 | 설명 | 사용 시점 |
|--------|------|----------|
| `/resume` | 상태 복구 후 FAILED TASK부터 재개 | 세션 시작, 중단 후 복구 |
| `/next` | 우선순위 1개 TASK 선택 후 실행 | 다음 작업 자동 선택 |
| `/fix` | 현재 오류 탐지 후 수정 | 빌드/validator 실패 시 |
| `/harden` | Validator 보강 | 새 도메인 추가 시 |
| `/enable-failure-policy` | 실패 정책 점검 및 적용 | 정책 변경 필요 시 |

---

## 에이전틱 실행기 (EXPERIMENTAL)

### harness/run.py

`claude CLI`를 subprocess로 호출해 research.md + failed_tasks.md 컨텍스트를 자동 주입하는 실행기.

```bash
# 전제조건
npm install -g @anthropic-ai/claude-code   # claude CLI 설치
# ANTHROPIC_API_KEY 환경변수 설정

# 기본 실행 (research.md 기반 자동 재개)
python3 harness/run.py

# 특정 지시사항 주입
python3 harness/run.py "TASK 5: 메뉴 섹션 구현을 완성해"

# 프롬프트 미리보기 (실제 실행 없음)
python3 harness/run.py --dry-run
```

**동작 흐름:**
1. 사전 validator 전체 실행
2. research.md + failed_tasks.md 읽어 컨텍스트 구성
3. `claude -p "<prompt>"` 실행 (실시간 스트리밍)
4. 사후 validator 전체 실행
5. 결과 리포트

> ⚠️ EXPERIMENTAL: claude CLI 설치 및 `ANTHROPIC_API_KEY` 필수. 실제 파일 수정 발생.

---

## TASK 우선순위 체계

```
1순위  FAILED TASK 복구
2순위  Validator / 하네스 강화
3순위  프로젝트 구조 정리
4순위  타입 시스템 / 인터페이스 설계
5순위  문서화 / 정책 정리
6순위  기능 구현 (UI / API / DB)
7순위  테스트 / 성능 최적화
```

---

## 실패 처리 흐름

```
TASK 실행
  │
  ├─ 성공 → research.md 업데이트 → 다음 TASK
  │
  └─ 실패 → 원인 분석 → 재시도 (최대 3회)
              │
              ├─ 재시도 성공 → research.md 업데이트
              │
              └─ 3회 초과 실패 → failed_tasks.md 기록 → 다음 독립 TASK
```

### failed_tasks.md 기록 형식

```markdown
## [TASK 이름]
- Status: FAILED
- Failed At: YYYY-MM-DD
- Retry Count: 3
- Summary: 한 줄 요약
- Error Detail: 실제 에러 내용
- Suspected Cause: 추정 원인
- Suggested Fix: 다음에 시도할 해결 방법
- Related Files: 관련 파일 목록
- Resume Hint: 재실행 명령
```

---

## 재개 흐름

```
세션 시작
  → research.md 상단 대시보드 확인
  → failed_tasks.md 확인
  → FAILED TASK 있음? → 그것부터 처리
  → FAILED TASK 없음? → 다음 우선순위 TASK 실행
  → 작업 종료 시 research.md + failed_tasks.md 업데이트
```

---

## Validator 실행

```bash
# 프로젝트 루트에서 실행
cd /Users/seojunseop/Desktop/food-harness-app
python3 harness/validators/run_all.py
```

### 현재 Validator 목록 (16개)

| # | 이름 | 카테고리 |
|---|------|----------|
| 1 | required_fields | base |
| 2 | no_sensitive_logs | base |
| 3 | region_logic | region |
| 4 | review_source | review |
| 5 | review_sentiment | review |
| 6 | reservation_check | reservation |
| 7 | waiting_evidence | waiting |
| 8 | user_ownership | user |
| 9 | api_exposure | security |
| 10 | hardcoded_key | security |
| 11 | env_access | security |
| 12 | service_role_key | security |
| 13 | pii_in_logs | security |
| 14 | console_debug | security |
| 15 | restaurant_region_required | data |
| 16 | menu_source_required | data |

---

## 절대 규칙

| 규칙 | 내용 |
|------|------|
| .env 수정 금지 | .env.example만 관리 가능 |
| API Key 출력 금지 | 실제 민감값은 절대 생성/출력하지 않음 |
| 패키지 승인 필요 | 사용자 승인 없이 npm install 금지 |
| Validator 우선 | 코드 구현보다 구조/정책/검증이 먼저 |
| 소유권 분리 | user_id 없이 favorites/history 저장 금지 |
| region 분기 필수 | region 없이 지도/검색 기능 구현 금지 |

---

## 운영 체크리스트 (매일 아침)

```
[ ] research.md 대시보드 확인
[ ] failed_tasks.md 실패 항목 확인
[ ] python3 harness/validators/run_all.py 실행 (변경사항 있을 때)
[ ] 오늘 작업 TASK 선택
[ ] 작업 종료 후 research.md 업데이트
```

---

## 재개 명령 (즐겨찾기)

```
# 완전 복구
research.md와 failed_tasks.md를 읽고 FAILED된 TASK부터 이어서 진행해

# 다음 TASK 하나만
research.md를 읽고 다음 우선순위 TASK 1개만 선택해서 진행해

# 전체 상태 요약
현재 프로젝트 상태를 요약하고 가장 중요한 구조 작업부터 진행해
```
