하네스 실행 정책을 강화해.

반드시 아래 규칙을 적용해:

1. 각 TASK 또는 검증 단계는 실패 시 최대 3회까지 재시도한다.
2. 재시도할 때마다 이전 실패 원인을 반영해서 수정 후 다시 실행한다.
3. 3회 재시도 후에도 실패하면 즉시 중단한다.
4. 한 TASK가 중단되어도 전체 작업은 멈추지 말고 다음 독립 TASK로 진행한다.
5. 최종 실패한 TASK는 반드시 별도 로그 파일에 기록한다.
6. research.md에도 실패 요약을 남긴다.

실패 로그 파일 규칙:
- 프로젝트 루트에 failed_tasks.md 파일을 사용한다.
- 파일이 없으면 생성한다.
- TASK가 최종 실패할 때마다 아래 형식으로 새 항목을 추가한다.

기록 형식:
## [TASK 이름]
- Status: FAILED
- Failed At: 현재 날짜/시간
- Retry Count: 3
- Summary: 한 줄 요약
- Error Detail: 실제 에러 내용
- Suspected Cause: 추정 원인
- Suggested Fix: 다음에 시도할 해결 방법
- Related Files: 관련 파일 목록
- Resume Hint: 다시 실행할 때 사용할 명령

추가 규칙:
- 같은 TASK가 나중에 다시 실패해도 기존 항목을 덮어쓰지 말고 새 로그로 추가한다.
- failed_tasks.md는 사람이 읽기 쉽게 마크다운으로 정리한다.
- 작업 종료 시 마지막에 FAILED TASK 목록만 따로 요약한다.
- /resume 시에는 research.md와 failed_tasks.md를 함께 읽고, FAILED TASK부터 먼저 재개하도록 한다.

지금 할 일:
1. 위 정책을 현재 하네스 실행 흐름에 반영
2. failed_tasks.md 생성 또는 초기화 정책 수립
3. 예시 FAILED 로그 1개 작성
4. research.md에 이 실패 처리 정책을 기록
5. 생성/수정된 파일 목록 출력

출력 형식:
- 적용한 재시도 정책
- 생성/수정 파일 목록
- failed_tasks.md 예시
- /resume 동작 방식
