# 개발 루프 가이드

> 최종 업데이트: 2026-04-20  
> 하네스 업그레이드 이후 실전 운용 방식 정리

---

## 1. 한 줄 요약

```
/harness → /build-X → /review → (문제 있으면 /fix) → 반복
```

---

## 2. 슬래시 커맨드 전체 목록

| 커맨드 | 역할 | 언제 쓰나 |
|--------|------|----------|
| `/harness` | 현재 상태 파악 + 다음 TASK 선택 | 세션 시작 시 / 무엇을 할지 모를 때 |
| `/resume` | research.md + failed_tasks.md 복구 후 재개 | 중단 후 재시작 / FAILED TASK 있을 때 |
| `/next` | 우선순위 1개 TASK만 선택·실행 | 빠르게 한 개만 처리할 때 |
| `/build-search` | 검색 화면 개선 | 검색 UI/UX 작업 |
| `/build-detail` | 상세 페이지 개선 | 리뷰·메뉴·예약·웨이팅 UI |
| `/build-favorites` | 즐겨찾기 탭 개선 | 즐겨찾기 필터·삭제·정렬 |
| `/build-history` | 방문 기록 탭 개선 | 날짜 그룹·중복 표시·삭제 |
| `/review` | 변경사항 8개 체크리스트 검증 | 작업 완료 후 검증 |
| `/fix` | 구조 문제·validator 위반·보안 문제 수정 | validator 실패 / 타입 에러 |
| `/harden` | validator 추가·보안 강화 | 새 도메인 추가 시 |

---

## 3. 새 하네스 요소가 개발 루프에서 하는 역할

### PreToolUse hook (자동)
Claude가 `rm -rf`, `git push --force`, `DROP TABLE` 같은 위험 명령을 실행하려 하면 **자동 차단**됨.  
별도 설정 없이 `.claude/settings.json`에서 이미 동작 중.

```
내가 할 것: 없음 (자동)
```

### postToolUse hook (자동)
Edit/Write 도구 사용 후 `harness/hooks/run_validators.sh` 자동 실행.  
validator 실패 시 즉시 알림.

```
내가 할 것: 없음 (자동)
파일 수정 후 에러 나오면 → /fix
```

### blocked 상태
run.py 실행 중 Claude가 `[BLOCKED: <사유>]` 를 출력하면 자동으로:
- 실행 중단 (exit code 2)
- `docs/failed_tasks.md`에 BLOCKED 기록
- 사유 출력

```
내가 할 것:
1. failed_tasks.md에서 blocked_reason 확인
2. 해당 작업(API 키 설정, Supabase 마이그레이션 등) 직접 처리
3. python3 harness/run.py "이전 TASK 재개" 재실행
```

### retry + 에러 피드백
run.py가 실패하면 이전 에러 메시지를 다음 프롬프트에 자동 주입하여 최대 3회 재시도.

```
내가 할 것: 없음 (자동)
3회 후에도 실패 → failed_tasks.md 확인 → /fix 또는 수동 처리
```

---

## 4. 실제 개발 루프 예시

### 시나리오 A: 검색 화면 개선

```
1. Claude에게: /build-search
   → index.tsx + useSearch.ts 읽음
   → debounce / 카테고리 필터 / 빈 결과 개선 작업

2. 작업 중 validator 자동 실행 (postToolUse hook)
   → 위반 즉시 알림

3. 완료 후: /review
   → 8개 체크리스트 검증 (하네스 규칙, validator, 보안, region, etc.)

4. 문제 없으면 → 완료
   문제 있으면 → /fix → 다시 /review
```

### 시나리오 B: 세션 재시작 후 이어서 작업

```
1. Claude에게: /resume
   → research.md + failed_tasks.md 읽음
   → FAILED TASK 있으면 그것부터
   → 없으면 다음 우선순위

2. 작업 단위 완료 후 /review
3. 이상 없으면 종료
```

### 시나리오 C: 자동화 실행 (run.py)

```bash
# 터미널에서 직접
cd /Users/seojunseop/Desktop/food-harness-app

# 기본 실행 (research.md 기반 자동)
python3 harness/run.py

# 특정 작업 지시
python3 harness/run.py "/build-search: debounce 검색 추가"

# 프롬프트 미리보기 (실행 없음)
python3 harness/run.py --dry-run

# 재시도 횟수 조정
python3 harness/run.py --max-retries 2 "특정 TASK"
```

---

## 5. 최소 UI 테스트 루틴 (기능 빌드 후 필수)

빌드 완료 후 **60초 안에** 아래만 확인하면 된다.

```bash
# 1. 하네스 검증 (30초)
python3 harness/validators/run_all.py
# → 16개 PASS 필수

# 2. 앱 실행 (30초 이내)
npx expo start --clear
```

| # | 화면 | 확인할 것 | 소요 |
|---|------|----------|------|
| 1 | 홈(검색) | 검색창 탭 → 키보드 올라옴 / 검색어 입력 → 카드 표시 | 10s |
| 2 | 상세 페이지 | 카드 탭 → 상세 이동 / 즐겨찾기 토글 | 10s |
| 3 | 즐겨찾기 탭 | 저장한 식당 표시 / 카드 탭 → 상세 이동 | 10s |
| 4 | 프로필 탭 | 방문 기록 표시 (자동 저장됨) | 10s |

> **빌드 대상 화면만 집중 테스트**하고 나머지는 regression 확인 수준으로.

---

## 6. run.py 실전 운용 가이드

### 전제조건 확인
```bash
# claude CLI 설치 확인
which claude || echo "미설치 → npm install -g @anthropic-ai/claude-code"

# API 키 확인
echo $ANTHROPIC_API_KEY | head -c 10  # 값이 있으면 OK (전체 출력 금지)
```

### 권장 사용 패턴

| 상황 | 명령 |
|------|------|
| 오늘 할 작업 자동 선택 | `python3 harness/run.py` |
| 특정 화면 작업 지시 | `python3 harness/run.py "/build-detail P1 작업 완성해"` |
| 실패 복구 | `python3 harness/run.py "failed_tasks.md의 마지막 실패 항목 수정해"` |
| 안전하게 확인만 | `python3 harness/run.py --dry-run` |
| 빠른 재시도 (1회) | `python3 harness/run.py --max-retries 1 "빠른 수정"` |

### 실행 흐름
```
run.py 시작
  ├─ [1/3] validator 사전 검증 (실패해도 계속)
  ├─ [2/3] claude 실행
  │    ├─ progress_indicator 스피너 표시
  │    ├─ 실패 → 에러 피드백 주입 후 재시도 (최대 3회)
  │    ├─ BLOCKED 감지 → exit(2) + failed_tasks.md 기록
  │    └─ 성공 → exit(0)
  └─ [3/3] validator 사후 검증 (항상 실행)
```

### exit code 의미
| code | 의미 | 대응 |
|------|------|------|
| 0 | 성공 | — |
| 1 | 실패 (3회 재시도 후) | failed_tasks.md 확인 → /fix |
| 2 | BLOCKED (수동 개입 필요) | 사유 해결 후 재실행 |

---

## 7. 다음 우선순위 (Phase 11)

기능 개선보다 **DB 구조 확장이 먼저**다.

```
1순위  supabase/migrations/003_add_domain_tables.sql 작성
       → menus, reviews, reservations, waiting 테이블
       → 사용자가 Supabase에서 실행해야 함

2순위  Edge Function 검색 전환 (네이버/구글 실제 API 연동)
       → ANTHROPIC_API_KEY + 네이버/구글 API 키 필요 → run.py BLOCKED 예상

3순위  /build-detail P1 (리뷰 하이라이트 키워드)
4순위  /build-search P2 (카테고리 필터 칩)
5순위  /build-favorites P1 (region 필터)
6순위  /build-history P1 (날짜 그룹핑)
```
