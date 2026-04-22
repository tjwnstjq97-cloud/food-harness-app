이 프로젝트는 Harness 프레임워크를 사용한다. 아래 워크플로우에 따라 작업을 진행하라.

---

## 워크플로우

### A. 탐색

다음 문서들을 읽고 프로젝트의 기획·아키텍처·현재 상태를 파악한다:

- `/CLAUDE.md` — 절대 규칙 (CRITICAL)
- `/docs/architecture.md` — 구조와 기술 스택
- `/docs/ADR.md` — 아키텍처 결정 기록
- `/research.md` — 진행 상황 대시보드 + 완료/실패 TASK 이력
- `/docs/failed_tasks.md` — 실패 TASK 목록 (있으면)

### B. 상태 파악

research.md 대시보드를 확인하고 아래를 정리한다:

1. 완료된 TASK 목록
2. FAILED된 TASK (있으면 최우선 처리)
3. 현재 진행 중인 TASK
4. 다음 우선순위 TASK (research.md "다음 우선순위" 참고)

우선순위:
```
1순위  FAILED TASK 복구
2순위  Validator / 하네스 강화
3순위  프로젝트 구조 정리
4순위  타입 시스템 / 인터페이스
5순위  문서화 / 정책
6순위  기능 구현 (UI / API / DB)
7순위  테스트 / 성능 최적화
```

### C. TASK Step 설계

구현 계획을 여러 step으로 나눈다.

설계 원칙:

1. **Scope 최소화** — 하나의 step에서 하나의 레이어/모듈만 다룬다.
2. **자기완결성** — 각 step 지시는 독립 세션에서도 실행 가능하게 작성한다. "이전 대화에서 논의한 바와 같이" 금지.
3. **사전 준비 강제** — 관련 문서 경로와 이전 step 산출물 파일 경로를 명시한다.
4. **AC는 실행 가능한 커맨드** — `python3 harness/validators/run_all.py` 등 실제 실행 커맨드 포함.
5. **주의사항 구체적** — "조심해라" 대신 "X를 하지 마라. 이유: Y" 형식.
6. **실패 정책 명시** — 3회 재시도 후 실패 시 failed_tasks.md에 기록.

### D. 실행

각 step 완료 후:

1. `python3 harness/validators/run_all.py` 실행 → 16개 PASS 확인
2. research.md 업데이트 (완료 TASK 기록)
3. 실패 시 최대 3회 재시도 (이전 에러 원인 반영)
4. 3회 초과 시 failed_tasks.md에 기록하고 다음 독립 TASK로 이동

### E. 에이전틱 실행 (선택)

```bash
# claude CLI 설치 + ANTHROPIC_API_KEY 설정 후
python3 harness/run.py                     # 자동 실행 (research.md 기반)
python3 harness/run.py "특정 지시사항"      # 직접 지시
python3 harness/run.py --dry-run           # 프롬프트 미리보기
```

---

## Validator 실행

```bash
cd /Users/seojunseop/Desktop/food-harness-app
python3 harness/validators/run_all.py
# 기대값: 16개 모두 PASS
```

---

## 절대 규칙 (CLAUDE.md 요약)

- console.log/debug/trace 금지 (console.info만 허용)
- API Key 하드코딩 절대 금지
- region(KR/GLOBAL) 분기 없이 지도/검색 구현 금지
- source 없는 리뷰/메뉴 표시 금지
- Validator 실패 상태로 TASK 완료 처리 금지
