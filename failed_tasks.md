# Failed Tasks Log

> 최대 3회 재시도 후에도 실패한 TASK를 기록합니다.
> 세션 재개 시 이 파일을 읽고 FAILED TASK부터 재개합니다.

## 실패 정책

- 각 TASK는 실패 시 최대 **3회** 재시도
- 재시도마다 이전 실패 원인을 반영하여 수정 후 재실행
- 3회 초과 실패 시 즉시 중단, 이 파일에 기록
- 한 TASK 실패해도 다음 독립 TASK로 계속 진행
- 같은 TASK가 다시 실패하면 기존 항목 유지 + 새 로그 추가

## 기록 형식 (템플릿)

```
## [TASK 이름]
- **Status:** FAILED
- **Failed At:** YYYY-MM-DD HH:MM
- **Retry Count:** 3
- **Summary:** 한 줄 요약
- **Error Detail:** 실제 에러 내용
- **Suspected Cause:** 추정 원인
- **Suggested Fix:** 다음에 시도할 해결 방법
- **Related Files:** 관련 파일 목록
- **Resume Hint:** 다시 실행할 때 사용할 명령
```

---

## 재개 방법

세션이 끊겼을 때:

```
research.md와 failed_tasks.md를 읽고 FAILED된 TASK부터 이어서 진행해.
```

특정 기능 구현이 필요할 때:

```
research.md를 읽고 다음 우선순위 TASK 1개만 선택해서 진행해.
```

빠른 상태 요약이 필요할 때:

```
현재 프로젝트 상태를 요약하고 가장 중요한 기능 1개 구현해.
```

---

## 현재 실패 기록

(현재 실패한 TASK 없음 — 2026-04-19, Phase 8 진행 중)

### Phase 8 진행 상황
- 15개 Validator: 전체 PASS ✅
- 완료된 TASK: 10, 4, 6, 7, 1, 2, 3, 5, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 22, 23, 24, 25
- 스킵된 TASK: 17 (map.tsx는 prebuild 전 placeholder 유지), 21 (파일 수 부족으로 이동 보류)
- 남은 TASK: 26, 27, 28, 29, 30 (research.md 정리 및 계획)
