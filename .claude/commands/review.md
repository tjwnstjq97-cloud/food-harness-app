이 프로젝트의 변경 사항을 리뷰하라.

먼저 다음 문서들을 읽어라:
- `/CLAUDE.md`
- `/docs/architecture.md`
- `/docs/ADR.md` (있으면)

그런 다음 변경된 파일들을 확인하고, 아래 체크리스트로 검증하라.

## 체크리스트

1. **하네스 규칙 준수**: CLAUDE.md의 CRITICAL 규칙(region 분기, 리뷰 출처, 예약 링크, 민감정보 등)을 위반하지 않았는가?
2. **Validator 통과**: `python3 harness/validators/run_all.py` 실행 시 16개 모두 PASS인가?
3. **아키텍처 준수**: docs/architecture.md에 정의된 디렉토리 구조와 역할을 따르고 있는가?
4. **보안 규칙**: API Key 하드코딩 없음 / console.log 없음(console.info만 허용) / .env 직접 접근 없음?
5. **⛔ .env 미수정**: Claude가 이번 작업에서 .env 또는 .env.example의 값을 읽거나 수정하지 않았는가? (위반 시 즉시 실패)
5. **region 분기**: KR/GLOBAL 분기가 필요한 곳에 빠짐없이 있는가?
6. **graceful fallback**: DB 테이블 미존재(42P01) 시 앱 크래시 없이 빈 결과 반환하는가?
7. **타입 안전성**: TypeScript 타입이 정확히 사용되었는가? `any` 남용 없음?
8. **소유권 분리**: favorites/history 관련 코드에 user_id 기반 RLS가 적용되어 있는가?

## 출력 형식

| 항목 | 결과 | 비고 |
|------|------|------|
| 하네스 규칙 준수 | ✅/❌ | {상세} |
| Validator 통과 (16개) | ✅/❌ | {상세} |
| 아키텍처 준수 | ✅/❌ | {상세} |
| 보안 규칙 | ✅/❌ | {상세} |
| region 분기 | ✅/❌ | {상세} |
| graceful fallback | ✅/❌ | {상세} |
| 타입 안전성 | ✅/❌ | {상세} |
| 소유권 분리 | ✅/❌ | {상세} |

위반 사항이 있으면 수정 방안을 구체적으로 제시하라.
수정이 필요하면 직접 수정한 뒤 다시 Validator를 실행하라.
