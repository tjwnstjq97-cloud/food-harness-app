research.md와 failed_tasks.md를 함께 읽고 현재 상태를 복구해.

규칙:
1. 완료된 TASK, 진행 중 TASK, FAILED된 TASK를 먼저 요약한다
2. FAILED된 TASK가 있으면 그것부터 먼저 처리한다
3. 각 TASK는 실패 시 최대 3회까지 재시도한다
4. 재시도 시 이전 실패 원인을 반영해서 수정 후 다시 실행한다
5. 3회 초과 시 해당 TASK는 중단하고 failed_tasks.md에 기록한다
6. 한 TASK가 실패해도 전체 작업은 멈추지 말고 다음 독립 TASK로 진행한다
7. 작업 종료 시 research.md와 failed_tasks.md를 업데이트한다

출력 형식:
- 현재 상태 요약
- 재개한 TASK
- 새로 완료된 TASK
- 여전히 FAILED된 TASK
- 다음 추천 작업 3개
