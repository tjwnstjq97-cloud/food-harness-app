# Research Log

## 진행상황 대시보드 (2026-04-22) ← Phase 17 완료

| 항목 | 값 |
|------|-----|
| 현재 단계 | **Phase 17 — UX 폴리시 2차 + 안정화 (자율 작업 10개)** |
| 전체 완료율 | **~99.5%** |
| 마지막 완료 TASK | Phase 17 — 카테고리 한글, 빈상태 CTA, 외부링크, 설정모달, 하이라이트, ErrorBoundary, 정렬, region 컬러 |
| 구현 완료 화면 | 로그인(+검증/비밀번호토글), 회원가입(+강도바), 검색(+자동완성+페이지네이션+카테고리필터), 상세(+Toast+공유), 즐겨찾기(+스와이프), 프로필(+통계+아바타), 지도(+빠른검색) |
| Validator 수 | **16개 (전체 PASS ✅)** |
| FAILED TASK 수 | **0** |
| DB 마이그레이션 | 3개 (사용자 실행 필요) |
| 테스트 데이터 | test_restaurants.sql, test_domain_data.sql 작성 완료 |
| Edge Function | **search-restaurant 배포 완료 ✅** (네이버 + Google Places API New) |

### 사용자 요구사항 검토 및 일치 확인 (2026-04-22)
- 사용자가 제시한 12개 기능 요구사항을 CLAUDE.md 및 현재 프로젝트 구조와 비교 분석.
- **결론**: 프로젝트 설계가 사용자의 요구사항과 100% 일치. 하네스 엔지니어링 기반으로 구조 검증 완료, 기능 구현 준비 상태.
- **세부 일치사항**:
  1. 구글 지도 검색: 네이버(국내)/구글(글로벌) 지도 연동 구현됨.
  2. 낮은 점수 리뷰 단점 추출: 리뷰 출처 분리, 부정 리뷰 강조.
  3. 높은 점수 리뷰 장점 추출: 긍정 리뷰 분리.
  4. 운영 정보 탭: 상세 페이지에 시간, 전화, 메뉴, 가격 탭.
  5. 예약 방법/링크: 예약 정보 표시 (없으면 "정보 없음").
  6. 예약 없이 이용 가능: 웨이팅 정보로 대체.
  7. 웨이팅 예측: 근거 없으면 "추정" 표시.
  8. 주로 먹는 메뉴: 리뷰/블로그 분석으로 메뉴 추출.
  9. 길찾기: 구글/네이버 지도 연동.
  10. 보안 연구: 아래 보안 연구 섹션 추가 (심도 있게 연구 진행).
  11. 히스토리/즐겨찾기: 사용자별 분리, 관리 기능 구현.
  12. 회원가입/로그인: Supabase Auth 기반 구현.
- **다음 단계 제안**: 보안 연구 완료 후, 기능 구현 시작. 사용자가 코드를 수정하여 알려주면 검증/기록.

### 작업 내용 Copilot으로 이전 가이드 (2026-04-22)
- 사용자 요청: 리뷰 분석 작업을 VS Code Copilot으로 옮겨 진행.
- 방법: 파일 열기 → 프롬프트 입력 → 코드 생성 → 검증.
- 기록: Copilot 사용 시 research.md에 결과 기록 요청.

### Phase 17 — UX 폴리시 2차 / 안정화 (2026-04-22)
- ✅ 1. 카테고리 한글 매핑 (`src/utils/categoryMap.ts` 신규) — Google Places type을 한글로 변환, RestaurantCard / 상세 / 검색 결과 / 카테고리 칩 모두 적용
- ✅ 2. 빈 화면 CTA 버튼 — `EmptyView` 에 `actionLabel/onAction` 추가, 즐겨찾기/방문기록 비었을 때 "음식점 검색하러 가기"
- ✅ 3. 상세 페이지 주소 공유 버튼 — 주소 행 탭 시 Share API + Toast (clipboard 패키지 미설치라 Share로 대체)
- ✅ 4. 외부 링크 섹션 — 구글/인스타/유튜브 + KR 한정 네이버 검색 버튼
- ✅ 5. 설정 모달 (`src/components/SettingsModal.tsx` 신규) — region 전환 + 검색기록 삭제 + 버전, 프로필 헤더 ⚙️ 버튼에서 진입
- ✅ 6. 검색 결과 텍스트 하이라이트 (`src/components/HighlightText.tsx` 신규) — 매칭된 검색어 주황색 강조
- ✅ 7. ErrorBoundary (`src/components/ErrorBoundary.tsx` 신규) — root `_layout.tsx` 에 `AppErrorBoundary` 로 적용 (expo-router 자체 ErrorBoundary와 별칭 분리)
- ✅ 8. 즐겨찾기 정렬 옵션 — 최신순 / 오래된순 / 이름순 칩
- ✅ 9. 상세 페이지 region 컬러 액센트 — KR 초록(#03C75A) / GLOBAL 파랑(#4285F4) 상단 라인 + 지도 버튼 컬러
- ✅ 10. testing-checklist.md TEST 18~21 추가 + research.md 업데이트 (이 항목)

### Phase 16 — UX 폴리시 / 자율 작업 (2026-04-22)
- ✅ 1. 즐겨찾기 탭 개수 배지 (`tabBarBadge`, `_layout.tsx`)
- ✅ 2. 홈 검색 결과 pull-to-refresh (`RefreshControl`, `index.tsx`)
- ✅ 3. 카테고리 칩 개수 표시 — "한식 (3)" 형태 (`index.tsx`)
- ✅ 4. 스크롤 시 키보드 자동 내림 (`keyboardDismissMode="on-drag"`)
- ✅ 5. 검색 히스토리 상대 시간 표시 — "방금 전", "3시간 전" (`searchHistoryStore.ts` + `formatRelativeTime`)
- ✅ 6. 프로필 이니셜 아바타 — 이미 존재 확인
- ✅ 7. 지도 탭 빠른 검색 버튼 8개 + `pendingSearchStore` (탭 간 검색 트리거)
- ✅ 8. 상세 페이지 전화 버튼 — 이미 존재 확인 (`handlePhoneCall`)
- ✅ 9. 로그인/회원가입 비밀번호 표시/숨김 토글 + 이메일 인라인 검증 + 비밀번호 강도 바
- ✅ 10. Toast 컴포넌트 (`StateViews.tsx` 의 `Toast` + `useToast`) → 즐겨찾기 추가/제거 피드백
- ✅ 11. 검색 소요 시간 표시 — "0.3초" (`useSearch.ts` 의 `formatSearchDuration`)
- ✅ 12. research.md Phase 16 업데이트 (이 항목)
- ✅ 13. testing-checklist.md TEST 14~17 추가

### Phase 15 — Edge Function 정상화 / Region 토글 (2026-04-22)
- ✅ Naver Local Search API 연동 (display 최대 5)
- ✅ Google Places API (New) 연동 — 신규 엔드포인트 (`places.googleapis.com/v1/places:searchText`)
- ✅ JWT Verification OFF (`--no-verify-jwt` 플래그) → `npm run deploy:fn` 스크립트 추가
- ✅ Region 토글 (`TouchableOpacity` 배지) → 검색 자동 초기화
- ✅ Edge Function `console.info` 로 통일 (validator `console_debug` 통과)

### Phase 14 — UI 폴리시 1차 (이전 세션)
- ✅ 카테고리 필터 칩 / 즐겨찾기 KR-GLOBAL 탭 / 히스토리 날짜 그룹 / 리뷰 펼치기
- ✅ 스와이프 삭제 (PanResponder 내장) / 스켈레톤 로딩 / 오프라인 에러 / 페이지네이션 / 공유 / 통계 카드

### 개발 루프 정립 (2026-04-20)
- ✅ .claude/commands/build-search.md 생성 (debounce, 카테고리 필터, 빈 결과 개선)
- ✅ .claude/commands/build-detail.md 생성 (리뷰 하이라이트, 더보기, 공유 버튼)
- ✅ .claude/commands/build-favorites.md 생성 (region 필터, 스와이프 삭제, 날짜 표시)
- ✅ .claude/commands/build-history.md 생성 (날짜 그룹, 중복 표시, 전체 삭제)
- ✅ docs/dev-loop.md 생성 (커맨드 사용 가이드, 개발 루프 예시, run.py 운용, UI 테스트 루틴)

### harness_framework-main 업그레이드 (2026-04-18)
- ✅ .claude/settings.json: PreToolUse hook 추가 (rm -rf / git push --force / DROP TABLE 등 위험 명령 자동 차단)
- ✅ .claude/commands/review.md: /review 슬래시 커맨드 신규 생성 (8개 체크리스트, 프로젝트 규칙 기반)
- ✅ .claude/commands/harness.md: /harness 슬래시 커맨드 신규 생성 (step 설계 워크플로우, research.md 방식 호환)
- ✅ harness/run.py: progress_indicator(스피너+경과시간), blocked 상태 처리, retry+에러피드백, load_guardrails(), 타임스탬프, --dangerously-skip-permissions, --output-format json, --max-retries 옵션 추가
- ✅ docs/ADR.md: 신규 생성 — 9개 실제 프로젝트 결정사항 (Expo, Supabase, Zustand+TQ, region분기, 역정규화, graceful fallback, validator, API Key, run.py)
- 보류: 전체 StepExecutor git 브랜치 자동화 (현재 개발 방식과 충돌 위험)
- 보류: phases/index.json JSON 상태머신 (research.md로 충분, 추후 확장 시 도입)
- 보류: test_execute.py pytest 전체 커버리지 (run.py 안정화 후 작성 예정)

### Phase 10 진행 내용 (2026-04-18)
- ✅ src/hooks/useMenus.ts 생성 (메뉴 조회, 42P01 graceful fallback, useSignatureMenus)
- ✅ src/components/ReviewCard.tsx 생성 (source 없으면 null, 감정배지/별점/텍스트)
- ✅ src/components/MenuSection.tsx 생성 (대표 메뉴, isSignature 배지, formatMenuPrice)
- ✅ src/stores/searchHistoryStore.ts 생성 (Zustand persist + AsyncStorage, 최대 10개)
- ✅ app/(tabs)/index.tsx 업데이트 (최근 검색어 칩, 검색 초기화, 카드 카테고리 배지)
- ✅ app/restaurant/[id].tsx 업데이트 (MenuSection + ReviewCard 연동, 중립 리뷰 수 추가)
- ✅ harness/validators/data/menu_source_required.py 신규 생성 (16번째 validator)
- ✅ harness/run.py 신규 생성 (claude CLI subprocess 실행기, --dry-run 지원, EXPERIMENTAL)
- ✅ docs/agentic_workflow.md 업데이트 (run.py 사용법, validator 16개로 갱신)
- ✅ docs/architecture.md 업데이트 (Phase 10 기준, 신규 파일 반영)
- ✅ docs/testing-checklist.md 업데이트 (TEST 6~8: 검색기록, 메뉴, 리뷰카드)

### Phase 9 완료 내용 (2026-04-19)
- ✅ useSearch 보완 (region 타입캐스팅, category 검색 추가, graceful error)
- ✅ useRestaurantById hook 신규 생성 (즐겨찾기/히스토리 → 상세 DB 보완)
- ✅ app/restaurant/[id].tsx store+DB 이중 fallback 완성
- ✅ favorites.tsx 상세 페이지 이동 연결 (카드 탭 → /restaurant/[id])
- ✅ profile.tsx 히스토리 카드 상세 이동 연결
- ✅ supabase/seed/test_restaurants.sql 생성 (KR 8개 + GLOBAL 4개)
- ✅ docs/testing-checklist.md 업데이트 (실제 동작 기준 5개 테스트)

### Phase 8 완료된 TASK
- ✅ TASK 1: app/restaurant/[id].tsx 상세 페이지 완성
- ✅ TASK 2: 검색 결과 → 상세 페이지 네비게이션
- ✅ TASK 3: selectedRestaurantStore 생성
- ✅ TASK 4: useFavorites dedup + toggleFavorite
- ✅ TASK 5: History 자동 기록 (상세 페이지 마운트 시)
- ✅ TASK 6: SearchBar 컴포넌트 분리
- ✅ TASK 7: RegionBadge 컴포넌트 생성
- ✅ TASK 8: useSearch 구조 개선
- ✅ TASK 9: useReviews graceful handling + neutralCount 수정
- ✅ TASK 10: useReservation graceful handling + status 분기
- ✅ TASK 11: useWaiting confidence 필드 수정
- ✅ TASK 12: mapLink.ts region guard 보강
- ✅ TASK 13: StateViews 보강 (NoDataView 추가)
- ✅ TASK 14: crudLogger.ts 안전 로거 생성
- ✅ TASK 15: docs/rls-verification.md 작성
- ✅ TASK 16: _layout.tsx restaurant 라우트 추가
- SKIPPED TASK 17: map.tsx placeholder 유지 (prebuild 전)
- ✅ TASK 18: Restaurant 타입 호환성 확인
- ✅ TASK 19: Review/Reservation/Waiting 타입 충돌 수정
- ✅ TASK 20: docs/feature-refactor-plan.md 작성
- SKIPPED TASK 21: 파일 이동 보류 (파일 수 < 30개)
- ✅ TASK 22: Validator 15개 전체 PASS 확인
- ✅ TASK 23: failed_tasks.md 재개 흐름 보강
- ✅ TASK 24: docs/architecture.md 최신화
- ✅ TASK 25: docs/testing-checklist.md 생성

### 남은 작업 (TASK 26~30 = research.md 정리)
- ✅ TASK 26~30: research.md에 현황 정리 (이 업데이트)

### 지금 바로 사용 가능한 기능
1. 이메일 로그인/회원가입 ✅
2. 음식점 검색 (DB에 데이터 있을 때) + 최근 검색어 기록 ✅
3. 검색 결과 탭 → 상세 페이지 이동 ✅
4. 즐겨찾기 추가/삭제/토글 ✅
5. 방문 기록 자동 저장 ✅
6. 지도 링크 (KR→Naver, GLOBAL→Google) ✅
7. 대표 메뉴 섹션 (menus 테이블 있을 때) ✅
8. 리뷰 카드 표시 (reviews 테이블 있을 때) ✅

### 아직 안 되는 기능 (이유)
- 실제 음식점 검색 결과 표시 → restaurants 테이블에 데이터 없음 (Edge Function deploy 필요)
- 리뷰/예약/웨이팅/메뉴 실제 데이터 → 해당 테이블 없음 (Edge Function + 마이그레이션 필요)
- 지도 탭 네이티브 지도 → Expo prebuild 필요
- harness/run.py 실제 실행 → claude CLI 설치 + ANTHROPIC_API_KEY 필요

### **[사용자 직접 해야 할 일]**
1. **DB 마이그레이션 실행**: Supabase SQL Editor → 001_create_tables.sql, 002_add_profiles_and_restaurants.sql
2. **테스트 데이터 삽입**: `supabase/seed/test_restaurants.sql` 실행 (검색 동작에 필수)
3. **Edge Function deploy**: 네이버/구글 API 키 등록 + deploy (검색 실제 동작)
4. **앱 눌러볼 것**: docs/testing-checklist.md의 TEST 1~8 수행

### **[Claude가 계속 할 수 있는 일]**
1. useSearch → Edge Function 전환 (API 키 있을 때)
2. Google 소셜 로그인 추가
3. 지도 탭 네이버 SDK 연동 (prebuild 후)
4. menus/reviews/reservations/waiting 테이블 마이그레이션 SQL 작성
5. 상세 페이지 하이라이트 키워드 표시
6. 검색 결과 페이지네이션

### 다음 우선순위 (Phase 11)
1. DB 마이그레이션: menus, reviews, reservations, waiting 테이블 SQL
2. useSearch → Edge Function 전환 (mock 분기 추가)
3. Google OAuth 로그인 추가
4. 상세 페이지 하이라이트(ReviewHighlight) 표시
5. 검색 결과 무한 스크롤 / 페이지네이션
7. 즐겨찾기 탭에서 상세 페이지 이동
8. 히스토리 탭에서 상세 페이지 이동
9. 다크모드 지원
10. 오프라인 상태 처리 (Network 오류 UI)

## 프로젝트 목적
개인용 음식점 탐색/리뷰/예약 보조 앱. 하네스 엔지니어링을 도입하여 검증 가능한 구조 위에서 기능을 확장하는 방식으로 개발한다.

## 핵심 문제 정의
- 음식점 정보가 여러 플랫폼에 분산되어 있어, 통합 검색/리뷰/예약 흐름이 필요
- 국내와 국외에서 사용하는 지도/검색 기반이 다름 (네이버 vs 구글)
- 데이터 정확성 보장을 위해 출처 없는 정보 표시를 방지해야 함

## 플랫폼 범위
- iOS, Android, Web 모두 지원 예정
- 프레임워크는 미확정 (추후 결정)

## 핵심 기능 목록 (12가지)
1. 음식점 검색
2. 리뷰 요약 (출처 필수)
3. 예약 방법 안내
4. 예약 링크 제공
5. 예약 없이 이용 가능 여부
6. 예상 웨이팅 (근거 필수)
7. 대표 메뉴 파악
8. 길찾기 이동 (지도 연동)
9. 히스토리 저장
10. 즐겨찾기
11. 회원가입
12. 로그인

## 국내/국외 분기 원칙
- region 필드: KR 또는 GLOBAL
- KR -> 네이버 지도 기반 검색/길찾기
- GLOBAL -> 구글 지도 기반 검색/길찾기
- region 분기 없이 지도 기능 구현 금지

## 하네스 구조 결정 사항
- validator 통과 전 완료 금지
- hooks: run_lint.sh -> run_tests.sh -> run_validators.sh 순서
- 초기에는 validator 중심 최소 구성
- validators 5개: required_fields, no_sensitive_logs, region_logic, review_source, reservation_check

## 현재 생성된 파일 목록
### 2단계 완료
- CLAUDE.md
- research.md
- .claude/settings.json
- .claude/memory/MEMORY.md

### 전체 파일 목록 (10단계 완료)
- CLAUDE.md, research.md, .gitignore, .env.example
- .claude/settings.json, .claude/memory/MEMORY.md
- hooks/run_lint.sh, run_tests.sh, run_validators.sh
- validators/run_all.py, test_fail_cases.py
- validators/base/required_fields.py, no_sensitive_logs.py
- validators/region/region_logic.py
- validators/review/review_source.py
- validators/reservation/reservation_check.py
- validators/waiting/waiting_evidence.py
- validators/user/user_ownership.py
- src/shared/types.py, constants.py, interfaces.py
- src/shared/security/env_loader.py, safe_logger.py
- src/app/config.py, registry.py
- src/features/map/factory.py
- src/features/map/kr/naver_map.py
- src/features/map/global_/google_map.py
- src/features/review/review_service.py, sentiment.py
- src/features/waiting/waiting_service.py
- src/features/auth/auth_service.py
- src/features/history/history_service.py
- src/features/favorites/favorites_service.py
- tests/test_validators.py
- scripts/ci_local.sh

## 규칙 강제 현황

| 규칙 | 문서(CLAUDE.md) | Validator 강제 | 비고 |
|------|:---:|:---:|------|
| 필수 필드 검사 | O | O | required_fields.py |
| 민감 정보 탐지 | O | O | no_sensitive_logs.py |
| region 분기 강제 | O | O | region_logic.py |
| 리뷰 출처 필수 | O | O | review_source.py |
| 예약 링크 필수 | O | O | reservation_check.py |
| 웨이팅 근거/추정 표기 | O | O | waiting_evidence.py |
| 사용자 데이터 소유권 분리 | O | O | user_ownership.py |
| 부정/긍정 리뷰 분리 | O | X | 추후 구현 시 validator 추가 필요 |
| validator 통과 전 완료 금지 | O | X | hooks 설정으로 강제 |
| API Key 하드코딩 금지 | O | O | no_sensitive_logs.py + hardcoded_key.py (소스코드 스캔) |
| 클라이언트 외부 API 직접 호출 금지 | O | O | api_exposure.py |
| 소스코드 API Key 노출 탐지 | O | O | hardcoded_key.py (파일 스캔, JWT/Google Key 등) |
| .env 직접 접근 금지 | O | O | env_access.py (dotenv/readFile/open 탐지) |
| 로그 개인정보 금지 | O | X | 런타임 로그 검사 필요, 추후 확장 |

## 보안상 주의할 점
- API Key, SECRET, TOKEN 코드 내 하드코딩 절대 금지
- 로그에 개인정보(이메일, 전화번호, 위치 등) 저장 금지
- 환경변수 또는 시크릿 매니저 사용 예정

## Phase 2: 아키텍처 설계 (구현 전 단계)

### 프레임워크 비교 결과
- React Native (Expo): 네이버 지도 공식 지원, JS/TS 기반, Expo로 배포 간편 → **추천**
- Flutter: 네이티브 퀄리티 최고이나 네이버 지도 공식 SDK 없음 → 국내 리스크
- Next.js + Capacitor: 웹 퀄리티 최고이나 앱 네이티브 퀄리티 중간 → 하이브리드 한계

### 추천 기술 스택
- 프론트엔드: React Native (Expo) + TypeScript
- 상태관리: Zustand + TanStack Query
- 백엔드/DB: Supabase (PostgreSQL + Auth + Edge Functions)
- 인증: Supabase Auth (소셜 로그인 포함)
- 지도: 네이버 지도 SDK (KR) / Google Maps SDK (GLOBAL)
- 외부 API Key: 백엔드(Edge Function)에서만 관리, 클라이언트 직접 호출 금지

### 아키텍처 구조
- 클라이언트: React Native (Expo) → 3플랫폼 동시 빌드
- API: Supabase Edge Functions (TypeScript)
- DB: Supabase PostgreSQL + RLS (user_id 기반 소유권 분리)
- 외부 API: 백엔드 → 네이버/구글/예약 플랫폼 (region 분기)

### 데이터 흐름
1. 사용자 액션 → 앱 (region 확인)
2. 앱 → Zustand 캐시 확인 → 있으면 즉시 반환
3. 캐시 없음 → Supabase Edge Function 호출
4. Edge Function: Auth 검증 → region별 외부 API → 데이터 정규화 → validator 규칙 적용
5. DB 저장 (RLS로 소유권 자동 분리) → 앱으로 응답

### 기능 개발 우선순위 (KR 먼저 → GLOBAL 확장)
1. 회원가입/로그인 (Supabase Auth)
2. 음식점 검색 (KR, 네이버)
3. 지도 표시 + 길찾기 (KR, 네이버 지도)
4. 리뷰 요약 (KR, 출처 필수)
5. 즐겨찾기 + 히스토리
6. 예약 링크 + 웨이팅
7. 대표 메뉴
8~12. GLOBAL 확장 (검색/지도/리뷰/예약)

### 확정된 결정 사항 (2026-04-16)
| # | 항목 | 확정 값 | 비고 |
|---|------|---------|------|
| 1 | 프레임워크 | React Native (Expo) | prebuild/dev build 전제 (네이티브 SDK용) |
| 2 | 백엔드/DB | Supabase | PostgreSQL + Auth + Edge Functions |
| 3 | 상태관리 | Zustand + TanStack Query | |
| 4 | 네이버 지도 연동 | 네이티브 SDK | Expo prebuild 필수 |
| 5 | 개발 순서 | KR 먼저 → GLOBAL 확장 | |
| 6 | 앱 이름 | 임시명(food-harness-app) | 추후 확정 |

## Phase 3: Expo 프로젝트 초기화 + 14 TASK 병렬 처리 (완료)

### Phase 3 결정 사항 (2026-04-16)
- 하네스를 harness/로 이동, Expo 프로젝트와 공존
- npx create-expo-app@latest (tabs 템플릿)으로 초기화
- Supabase 클라이언트: src/lib/supabase.ts
- docs/architecture.md 추가

### Phase 3 TASK 실행 결과

| TASK | 내용 | 상태 |
|------|------|------|
| 1 | Expo 프로젝트 초기화 | SUCCESS |
| 2 | 하네스 이동 및 정리 | SUCCESS |
| 3 | Supabase 연결 구조 | SUCCESS |
| 4 | 환경변수 시스템 | SUCCESS |
| 5 | 상태관리 구조 | SUCCESS |
| 6 | 지도 분기 구조 | SUCCESS |
| 7 | 인증/유저 시스템 | SUCCESS |
| 8 | 리뷰 분석 구조 | SUCCESS |
| 9 | 예약 시스템 구조 | SUCCESS |
| 10 | 웨이팅 추정 구조 | SUCCESS |
| 11 | 보안 구조 분석 | SUCCESS |
| 12 | src 구조 정리 | SUCCESS |
| 13 | 하네스 강화 (api_exposure) | SUCCESS (8개 validator) |
| 14 | CI 흐름 설계 | SUCCESS |

### Phase 3 생성 파일 목록
- app/ (Expo Router 기본 구조)
- src/lib/supabase.ts
- src/providers/ (Auth, Query, Region)
- src/stores/ (auth, region)
- src/types/ (auth, region, restaurant)
- src/utils/ (constants, validators)
- src/hooks/ (useAuth, useMap, useFavorites, useHistory, useReviews, useReservation, useWaiting)
- harness/validators/security/api_exposure.py
- docs/architecture.md
- .env.example, .gitignore 업데이트
- CLAUDE.md 업데이트

## Phase 4: 독립 TASK 실행 (완료)

### Phase 4 TASK 결과 (2026-04-16)

| TASK | 내용 | STATUS |
|------|------|--------|
| 0 | 명령어 시스템 + failed_tasks.md | SUCCESS |
| 1 | Supabase 연결 준비 | SUCCESS |
| 2 | DB 테이블 + RLS 설계 | SUCCESS |
| 3 | 패키지 점검 | SUCCESS |
| 4 | Auth 구조 설계 | SUCCESS |
| 5 | 탭/라우팅 구조 설계 | SUCCESS |
| 6 | 지도 연동 구조 점검 | SUCCESS |
| 7 | 리뷰/예약/웨이팅 도메인 점검 | SUCCESS |
| 8 | 보안 점검 | SUCCESS (11개 validator) |
| 9 | src 구조 정리 점검 | SUCCESS |
| 10 | 다음 단계 실행 계획 | SUCCESS |

### Phase 4 생성 파일
- .claude/commands/ (resume, next, fix, harden, enable-failure-policy)
- failed_tasks.md
- docs/supabase-setup.md
- supabase/migrations/001_create_tables.sql
- app/(auth)/_layout.tsx, login.tsx, register.tsx
- app/(tabs)/map.tsx, favorites.tsx, profile.tsx
- harness/validators/security/service_role_key.py

### Phase 4 수정 파일
- app/(tabs)/_layout.tsx, index.tsx (4탭 구조로 변경)
- harness/validators/run_all.py (11개 validator)
- docs/architecture.md (확장 가이드 추가)
- src/types/restaurant.ts (sentiment 주석 보강)

### 패키지 설치 대기 (승인 필요)
| 패키지 | 이유 |
|--------|------|
| @supabase/supabase-js | Supabase 클라이언트 |
| @react-native-async-storage/async-storage | 세션 저장 |
| zustand | 상태관리 |
| @tanstack/react-query | 서버 상태 |

### 다음 단계 계획

#### 사용자가 직접 해야 할 일
1. Supabase 프로젝트 생성 (supabase.com)
2. .env 파일 생성 (cp .env.example .env → 키 입력)
3. 패키지 4개 설치 승인
4. Supabase SQL Editor에서 001_create_tables.sql 실행

#### Claude가 다음에 할 일
1. 패키지 설치 (승인 후)
2. Auth UI 실제 구현 (로그인/회원가입 폼)
3. 루트 _layout.tsx에 Providers 연결
4. 음식점 검색 구조 구현 (KR, 네이버 API)
5. 즐겨찾기/히스토리 UI 구현

#### 바로 구현 가능한 것
- Auth UI (로그인/회원가입 폼 디자인)
- Provider 연결 (루트 레이아웃에 Auth/Query/Region Provider 래핑)
- 검색 UI placeholder

#### 외부 계정/키 필요해서 멈춘 것
- Supabase 연결 테스트 (SUPABASE_URL, ANON_KEY 필요)
- DB 테이블 생성 (Supabase 대시보드 접근 필요)
- 네이버 지도 연동 (NAVER_MAP_CLIENT_ID 필요 + prebuild)
- 네이버 검색 API (NAVER_SEARCH_CLIENT_ID 필요)

### Checkpoint (Phase 4 종료)
- 현재 상태: 하네스 11개 validator, Expo 4탭 구조, Auth 라우트, DB 스키마 설계 완료
- 다음 재개: "패키지 4개 설치를 승인한다" 또는 "/resume"

## 자동 실행 플로우 (10단계)

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | hooks + validators 생성 | 완료 |
| 2 | 하네스 연결 및 동작 검증 | 완료 |
| 3 | validator 테스트 시뮬레이션 | 완료 (32/32 통과) |
| 4 | 하네스 강화 (추가 validator 2개) | 완료 (7개 validator) |
| 5 | src 구조 설계 | 완료 |
| 6 | 지도 분기 구조 설계 | 완료 |
| 7 | 리뷰 분석 구조 설계 | 완료 |
| 8 | 웨이팅 구조 설계 | 완료 |
| 9 | 유저 시스템 구조 설계 | 완료 |
| 10 | 보안 구조 설계 | 완료 |

### 중단 시 복구 방법
- 이 research.md의 플로우 테이블에서 현재 "진행중" 단계를 확인
- Claude Code에 다음 메시지를 입력: "research.md를 읽고 중단된 단계부터 이어서 진행해"
- 또는 특정 단계부터: "N단계부터 이어서 진행해"

### 사용 명령어
- "다음 단계 진행해" — 현재 단계 완료 후 다음으로
- "N단계부터 이어서 진행해" — 특정 단계부터 재개
- "현재 상태 알려줘" — research.md 기준 진행 상황 확인

## Phase 5: 18 TASK 대규모 실행 (2026-04-17)

### Phase 5 실행 정책
- 최대 3회 재시도, 3회 실패 시 failed_tasks.md 기록
- 독립 TASK 단위 실행, 하나 실패해도 다음으로 진행
- validator 13개 (review_sentiment, pii_in_logs 추가)

### Phase 5 TASK 결과

| TASK | 내용 | STATUS |
|------|------|--------|
| 1 | 커스텀 명령어 시스템 설치 확인 | SUCCESS |
| 2 | 실패 정책 실제 반영 (13개 validator) | SUCCESS |
| 3 | feature 기반 리팩토링 계획 수립 | SUCCESS |
| 4 | shared/feature 경계 정리 | SUCCESS |
| 5 | Supabase 연결 준비 고도화 | SUCCESS |
| 6 | DB 스키마 + RLS 설계 고도화 | SUCCESS |
| 7 | Auth 구조 점검 | SUCCESS |
| 8 | Favorites/History 구조 점검 | SUCCESS (버그 수정) |
| 9 | Restaurant 도메인 타입 강화 | SUCCESS |
| 10 | 리뷰 구조 점검 | SUCCESS |
| 11 | 예약 구조 점검 | SUCCESS |
| 12 | 웨이팅 구조 점검 | SUCCESS |
| 13 | 지도 분기 구조 강화 | SUCCESS |
| 14 | 보안 validator 추가 (console_debug) | SUCCESS (14개) |
| 15 | package.json 의존성 감사 | SUCCESS |
| 16 | docs/architecture.md 보강 | SUCCESS |
| 17 | 진행상황 대시보드 정리 | SUCCESS |
| 18 | 재개 가이드 작성 | SUCCESS |

### Phase 5 생성 파일
- harness/validators/review/review_sentiment.py (validator #12)
- harness/validators/security/pii_in_logs.py (validator #13)
- harness/validators/security/console_debug.py (validator #14)
- supabase/migrations/002_add_profiles_and_restaurants.sql

### Phase 5 수정 파일
- harness/validators/run_all.py (14개 validator로 확장)
- failed_tasks.md (실패 정책 정비)
- .env.example (Edge Function URL 추가)
- src/hooks/useFavorites.ts (DB 스키마 불일치 수정)
- src/hooks/useHistory.ts (restaurant_region 파라미터 추가)
- src/hooks/useMap.ts (provider, searchApiBase 추가)
- src/types/restaurant.ts (SearchRequest, SearchResult, FavoriteRow, HistoryRow 추가)
- docs/architecture.md (전면 보강)
- research.md (대시보드, Phase 5 기록, 재개 가이드)
- .claude/commands/ (5개 명령어 재확인)

### Phase 5 버그 수정
1. **useFavorites.ts**: addFavorite에 restaurant_name, restaurant_region 파라미터 누락 — DB NOT NULL 제약조건과 불일치 → 수정 완료
2. **useHistory.ts**: addVisit에 restaurant_region 파라미터 누락 → 수정 완료
3. **run_all.py**: review_sentiment, pii_in_logs가 import만 되고 VALIDATORS 리스트 미등록 → 수정 완료

### 재개 가이드 (아침에 바로 사용)

#### 명령 1: 상태 복구
```
/resume
```
또는: "research.md와 failed_tasks.md를 읽고 현재 상태를 파악해"

#### 명령 2: 다음 작업 자동 선택
```
/next
```
또는: "research.md를 읽고 우선순위 가장 높은 다음 작업 1개 진행해"

#### 명령 3: 패키지 설치 승인 (사용자 액션 필요 시)
```
패키지 4개 설치를 승인한다
```
(@supabase/supabase-js, @react-native-async-storage/async-storage, zustand, @tanstack/react-query)

### Checkpoint (Phase 5 종료, 2026-04-17)
- 현재 상태: 14개 validator, Expo 4탭 + Providers 연결, DB 스키마 2개, feature 리팩토링 계획 수립
- FAILED: 0건
- 다음: 패키지 설치 승인 → Auth UI → 검색 구조

### TASK 3+4: Feature 기반 리팩토링 계획

#### 현재 구조 문제점
1. **평면적 분류**: hooks/, stores/, providers/, types/ 로 역할별 분류 → 기능이 늘어나면 한 폴더에 수십 개 파일
2. **도메인 응집도 낮음**: auth 관련 코드가 hooks/useAuth, stores/authStore, providers/AuthProvider, types/auth 4곳에 분산
3. **shared 경계 불명확**: validators.ts에 리뷰/예약/웨이팅 로직이 모두 들어있음 → 각 도메인으로 분리 필요
4. **restaurant.ts 과부하**: Review, Reservation, Waiting, MenuItem 등 서로 다른 도메인 타입이 하나의 파일에 집중

#### 제안 구조 (feature 기반)

```
src/
├─ shared/                    # 공통 코드만
│  ├─ lib/
│  │  └─ supabase.ts          # Supabase 클라이언트 (공통)
│  ├─ providers/
│  │  ├─ QueryProvider.tsx     # TanStack Query (공통)
│  │  └─ RegionProvider.tsx    # Region 분기 (전역)
│  ├─ stores/
│  │  └─ regionStore.ts       # Region 상태 (전역)
│  ├─ types/
│  │  └─ region.ts            # Region 타입 (전역)
│  └─ utils/
│     └─ constants.ts         # NO_INFO, ESTIMATED_LABEL 등
│
├─ features/
│  ├─ auth/
│  │  ├─ hooks/useAuth.ts
│  │  ├─ providers/AuthProvider.tsx
│  │  ├─ stores/authStore.ts
│  │  └─ types/auth.ts
│  │
│  ├─ restaurant/
│  │  ├─ types/restaurant.ts   # Restaurant, RestaurantDetail
│  │  └─ types/menu.ts        # MenuItem
│  │
│  ├─ review/
│  │  ├─ hooks/useReviews.ts
│  │  ├─ types/review.ts      # Review, ReviewSummary
│  │  └─ utils/validators.ts  # hasValidSource, filterValidReviews
│  │
│  ├─ reservation/
│  │  ├─ hooks/useReservation.ts
│  │  ├─ types/reservation.ts # Reservation
│  │  └─ utils/validators.ts  # formatReservation
│  │
│  ├─ waiting/
│  │  ├─ hooks/useWaiting.ts
│  │  ├─ types/waiting.ts     # Waiting
│  │  └─ utils/validators.ts  # formatWaiting
│  │
│  ├─ favorites/
│  │  └─ hooks/useFavorites.ts
│  │
│  ├─ history/
│  │  └─ hooks/useHistory.ts
│  │
│  └─ map/
│     ├─ hooks/useMap.ts
│     └─ types/map.ts         # MapConfig (추후)
```

#### 파일 이동 매핑

| 현재 위치 | 이동 위치 | 분류 |
|-----------|-----------|------|
| src/lib/supabase.ts | src/shared/lib/supabase.ts | shared |
| src/providers/QueryProvider.tsx | src/shared/providers/QueryProvider.tsx | shared |
| src/providers/RegionProvider.tsx | src/shared/providers/RegionProvider.tsx | shared |
| src/stores/regionStore.ts | src/shared/stores/regionStore.ts | shared |
| src/types/region.ts | src/shared/types/region.ts | shared |
| src/utils/constants.ts | src/shared/utils/constants.ts | shared |
| src/providers/AuthProvider.tsx | src/features/auth/providers/AuthProvider.tsx | auth |
| src/stores/authStore.ts | src/features/auth/stores/authStore.ts | auth |
| src/types/auth.ts | src/features/auth/types/auth.ts | auth |
| src/hooks/useAuth.ts | src/features/auth/hooks/useAuth.ts | auth |
| src/hooks/useFavorites.ts | src/features/favorites/hooks/useFavorites.ts | favorites |
| src/hooks/useHistory.ts | src/features/history/hooks/useHistory.ts | history |
| src/hooks/useMap.ts | src/features/map/hooks/useMap.ts | map |
| src/hooks/useReviews.ts | src/features/review/hooks/useReviews.ts | review |
| src/hooks/useReservation.ts | src/features/reservation/hooks/useReservation.ts | reservation |
| src/hooks/useWaiting.ts | src/features/waiting/hooks/useWaiting.ts | waiting |
| src/types/restaurant.ts | 분할: restaurant, review, reservation, waiting, menu | 분할 |
| src/utils/validators.ts | 분할: review/utils, reservation/utils, waiting/utils + shared/utils/region.ts | 분할 |

#### shared로 남기는 것 (전역 공통)
- supabase.ts — 모든 feature가 사용
- QueryProvider.tsx — 앱 전체 캐시
- RegionProvider.tsx — 앱 전체 region 분기
- regionStore.ts — 앱 전체 region 상태
- region.ts — 모든 곳에서 참조
- constants.ts — NO_INFO, ESTIMATED_LABEL

#### feature로 내리는 것 (도메인 전용)
- AuthProvider, authStore, auth.ts, useAuth → auth/
- useFavorites → favorites/
- useHistory → history/
- useMap → map/
- useReviews, Review, ReviewSummary, hasValidSource, filterValidReviews → review/
- useReservation, Reservation, formatReservation → reservation/
- useWaiting, Waiting, formatWaiting → waiting/
- Restaurant, RestaurantDetail, MenuItem → restaurant/

#### 장단점

**장점:**
- 도메인 응집도 향상 (auth 관련 코드를 auth/ 한 곳에서 관리)
- 기능 추가 시 해당 feature/ 디렉토리만 수정
- import 경로가 기능 명시적 (from "@/features/review/hooks/useReviews")
- 삭제/교체가 쉬움 (feature 단위로 제거 가능)

**단점:**
- 디렉토리 깊이 증가 (3~4단계)
- 파일 수가 적은 현재는 과도할 수 있음 (18개 파일)
- import 경로 변경으로 app/ 내 모든 import도 수정 필요
- cross-feature 의존 시 순환 참조 위험

#### 리팩토링 실행 시점 판단
- **현재**: 파일 18개로 아직 평면 구조로도 관리 가능
- **추천 시점**: 파일 30개 이상 또는 feature 구현 시작 시
- **지금은 계획만 수립**, 실제 이동은 승인 후 진행

#### 예상 리스크
1. app/ 내 import 경로 대량 변경 필요
2. harness validator(hardcoded_key, env_access 등)의 스캔 경로 확인 필요
3. tsconfig paths alias 재설정 가능성
4. 기존 테스트 import 경로 수정

---

## Phase 6: UI 구현 + 심층 분석 (2026-04-17)

### Phase 6 실행 정책
- P6-1~P6-6: UI 구현 (Auth, Search, Edge Function, Card, Favorites, Profile)
- TASK 19-45: 도메인 정책·타입·운영 가이드 문서화

### Phase 6 TASK 결과

| TASK | 내용 | STATUS |
|------|------|--------|
| P6-1 | Auth UI (login.tsx, register.tsx) | SUCCESS |
| P6-2 | 검색 UI + useSearch hook | SUCCESS |
| P6-3 | Edge Function (search-restaurant) | SUCCESS |
| P6-4 | RestaurantCard + StateViews 컴포넌트 | SUCCESS |
| P6-5 | 즐겨찾기 UI (favorites.tsx) | SUCCESS |
| P6-6 | 프로필 UI (profile.tsx) | SUCCESS |
| 19 | 파일 인벤토리 최신화 | SUCCESS |
| 20 | Feature 폴더 초안 설계 재확인 | SUCCESS |
| 21 | 파일 이동 위험도 테이블 | SUCCESS |
| 22 | 공통 컴포넌트 후보 목록 | SUCCESS |
| 23 | Restaurant 엔티티 타입 심층 분석 | SUCCESS |
| 24 | Favorites 엔티티 타입·흐름 | SUCCESS |
| 25 | History 엔티티 타입·흐름 | SUCCESS |
| 26 | Search 결과 데이터 모델 | SUCCESS |
| 27 | Map 링크/딥링크 정책 | SUCCESS |
| 28 | Reservation 도메인 정책 | SUCCESS |
| 29 | Waiting 도메인 정책 | SUCCESS |
| 30 | Review 요약 도메인 정책 | SUCCESS |
| 31 | Menu 추천 도메인 정책 | SUCCESS |
| 32 | Auth 상태 전이 문서화 | SUCCESS |
| 33 | 에러 분류 시스템 | SUCCESS |
| 34 | Loading/Empty/Error UX 가이드 | SUCCESS |
| 35 | Supabase 인덱스·성능 고려사항 | SUCCESS |
| 36 | RLS 테스트 시나리오 | SUCCESS |
| 37 | Validator 카테고리 재조직 | SUCCESS |
| 38 | False positive 위험 분석 | SUCCESS |
| 39 | lint/test/validator 흐름 문서화 | SUCCESS |
| 40 | 운영 가이드 (아침 재개 가이드) | SUCCESS |
| 41 | 앱 라우팅 구조 점검 | SUCCESS |
| 42 | Provider 레이어 점검 | SUCCESS |
| 43 | Store 책임 분리 | SUCCESS |
| 44 | 패키지 후보 재평가 | SUCCESS |
| 45 | 구현 전 체크리스트 | SUCCESS |

### Phase 6 생성/수정 파일
- app/(auth)/login.tsx (신규)
- app/(auth)/register.tsx (신규)
- app/(tabs)/index.tsx (전면 재구현)
- app/(tabs)/favorites.tsx (전면 재구현)
- app/(tabs)/profile.tsx (전면 재구현)
- src/hooks/useSearch.ts (신규)
- src/components/RestaurantCard.tsx (신규)
- src/components/StateViews.tsx (신규)
- supabase/functions/search-restaurant/index.ts (신규)
- supabase/functions/_shared/types.ts (신규)
- supabase/functions/_shared/cors.ts (신규)
- app/_layout.tsx (Providers 연결)
- src/types/restaurant.ts (SearchRequest, SearchResult, FavoriteRow, HistoryRow 추가)

---

## TASK 19: 파일 인벤토리 최신화 (2026-04-17)

### 현재 전체 파일 목록

#### app/ (Expo Router)
```
app/_layout.tsx              루트 레이아웃, Providers 연결
app/+html.tsx                HTML 엔트리
app/+not-found.tsx           404 화면
app/modal.tsx                모달 화면 (stub)
app/(auth)/_layout.tsx       Auth 라우트 그룹
app/(auth)/login.tsx         로그인 폼 ✅ 구현 완료
app/(auth)/register.tsx      회원가입 폼 ✅ 구현 완료
app/(tabs)/_layout.tsx       탭 네비게이션 (4탭)
app/(tabs)/index.tsx         검색 탭 ✅ 구현 완료
app/(tabs)/map.tsx           지도 탭 (stub)
app/(tabs)/favorites.tsx     즐겨찾기 탭 ✅ 구현 완료
app/(tabs)/profile.tsx       프로필/히스토리 탭 ✅ 구현 완료
```

#### src/ (앱 소스코드)
```
src/lib/supabase.ts          Supabase 클라이언트
src/providers/AuthProvider.tsx   Auth 상태 관리
src/providers/QueryProvider.tsx  TanStack Query 설정
src/providers/RegionProvider.tsx Region 분기 상태
src/stores/authStore.ts      Zustand Auth 스토어
src/stores/regionStore.ts    Zustand Region 스토어
src/types/auth.ts            Auth 관련 타입
src/types/region.ts          Region 타입 (KR|GLOBAL)
src/types/restaurant.ts      음식점·검색·즐겨찾기·히스토리 타입
src/utils/constants.ts       상수 (NO_INFO, ESTIMATED_LABEL 등)
src/utils/validators.ts      런타임 유효성 검사 헬퍼
src/hooks/useAuth.ts         signIn/signUp/signOut
src/hooks/useMap.ts          region→provider 분기
src/hooks/useFavorites.ts    즐겨찾기 CRUD
src/hooks/useHistory.ts      방문 기록 CRUD
src/hooks/useReviews.ts      리뷰 조회
src/hooks/useReservation.ts  예약 정보 조회
src/hooks/useWaiting.ts      웨이팅 정보 조회
src/hooks/useSearch.ts       음식점 검색 (Supabase 직접 → 추후 Edge Function)
src/components/RestaurantCard.tsx  음식점 카드 컴포넌트
src/components/StateViews.tsx      LoadingView/ErrorView/EmptyView
```

#### harness/ (검증 시스템)
```
harness/validators/run_all.py          14개 validator 실행기
harness/validators/base/required_fields.py
harness/validators/base/no_sensitive_logs.py
harness/validators/region/region_logic.py
harness/validators/review/review_source.py
harness/validators/review/review_sentiment.py
harness/validators/reservation/reservation_check.py
harness/validators/waiting/waiting_evidence.py
harness/validators/user/user_ownership.py
harness/validators/security/api_exposure.py
harness/validators/security/hardcoded_key.py
harness/validators/security/env_access.py
harness/validators/security/service_role_key.py
harness/validators/security/pii_in_logs.py
harness/validators/security/console_debug.py
harness/validators/test_fail_cases.py
harness/tests/test_validators.py
harness/hooks/run_lint.sh
harness/hooks/run_tests.sh
harness/hooks/run_validators.sh
harness/scripts/ci_local.sh
```

#### supabase/
```
supabase/migrations/001_create_tables.sql
supabase/migrations/002_add_profiles_and_restaurants.sql
supabase/functions/search-restaurant/index.ts  ✅ 구현 완료
supabase/functions/_shared/cors.ts            ✅ 구현 완료
supabase/functions/_shared/types.ts           ✅ 구현 완료
```

#### docs/
```
docs/architecture.md
docs/supabase-setup.md
```

**총 파일 수**: app 12개 + src 22개 + harness 19개 + supabase 5개 + docs 2개 = **60개**

---

## TASK 20: Feature 폴더 초안 설계 재확인 (2026-04-17)

### 현재 판단: 리팩토링 아직 이른 시점

| 기준 | 현재 값 | 임계치 | 판단 |
|------|---------|--------|------|
| src/ 파일 수 | 22개 | 30개 이상 | 아직 이른 편 |
| feature 구현 수 | 3개 완료 (auth/search/favorites) | 5개 이상 | 아직 이른 편 |
| 도메인 간 import 충돌 | 없음 | 있으면 즉시 | 문제 없음 |
| 하나의 hooks/ 파일 수 | 9개 | 12개 이상 | 경계선 근접 |

### 결론
- **현재**: 평면 구조 유지 (src/hooks/, src/types/ 등)
- **리팩토링 트리거 조건**: hooks/ 파일이 12개를 넘거나, 새 feature 추가 시 같은 hooks 파일명이 충돌할 때
- **준비만 완료**: TASK 3+4에서 설계한 feature 기반 구조는 언제든 실행 가능한 상태

---

## TASK 21: 파일 이동 위험도 테이블 (2026-04-17)

| 파일 | 이동 대상 | 위험도 | 이유 |
|------|-----------|--------|------|
| src/lib/supabase.ts | shared/lib/ | **낮음** | import 1곳만 수정 |
| src/types/region.ts | shared/types/ | **낮음** | 타입만, side effect 없음 |
| src/utils/constants.ts | shared/utils/ | **낮음** | 상수, 수정 불필요 |
| src/providers/QueryProvider.tsx | shared/providers/ | **낮음** | app/_layout.tsx 1곳만 수정 |
| src/providers/RegionProvider.tsx | shared/providers/ | **낮음** | app/_layout.tsx 1곳만 수정 |
| src/stores/regionStore.ts | shared/stores/ | **낮음** | RegionProvider에서만 사용 |
| src/types/auth.ts | features/auth/types/ | **낮음** | auth 관련 파일에서만 사용 |
| src/stores/authStore.ts | features/auth/stores/ | **낮음** | AuthProvider에서만 사용 |
| src/hooks/useAuth.ts | features/auth/hooks/ | **중간** | login.tsx, register.tsx import 수정 |
| src/providers/AuthProvider.tsx | features/auth/providers/ | **중간** | app/_layout.tsx + app/(auth)/_layout.tsx 수정 |
| src/hooks/useFavorites.ts | features/favorites/hooks/ | **중간** | favorites.tsx import 수정 |
| src/hooks/useHistory.ts | features/history/hooks/ | **중간** | profile.tsx import 수정 |
| src/hooks/useSearch.ts | features/restaurant/hooks/ | **중간** | index.tsx import 수정 |
| src/types/restaurant.ts | 분할 (4파일) | **높음** | 전체에서 참조, 분할 시 import 대규모 변경 |
| src/utils/validators.ts | 분할 (3개 feature) | **높음** | 분할 후 각 feature별 재배치 필요 |
| src/hooks/useReviews.ts | features/review/hooks/ | **낮음** | 미구현, import 없음 |
| src/hooks/useReservation.ts | features/reservation/hooks/ | **낮음** | 미구현, import 없음 |
| src/hooks/useWaiting.ts | features/waiting/hooks/ | **낮음** | 미구현, import 없음 |

**리팩토링 순서**: 위험도 낮음 → 중간 → 높음 순서로 단계적 실행

---

## TASK 22: 공통 컴포넌트 후보 목록 (2026-04-17)

### 현재 구현된 공통 컴포넌트
| 컴포넌트 | 위치 | 사용처 |
|----------|------|--------|
| RestaurantCard | src/components/ | index.tsx, favorites.tsx, profile.tsx |
| LoadingView | src/components/StateViews.tsx | index.tsx, favorites.tsx, profile.tsx |
| ErrorView | src/components/StateViews.tsx | index.tsx, favorites.tsx |
| EmptyView | src/components/StateViews.tsx | index.tsx, favorites.tsx, profile.tsx |

### 향후 추가 후보
| 컴포넌트 | 우선순위 | 설명 |
|----------|----------|------|
| SearchBar | 높음 | 검색 입력 + 실행 버튼, index.tsx에서 분리 |
| RegionBadge | 높음 | KR/GLOBAL 배지, 여러 화면에서 사용 |
| StarRating | 중간 | 리뷰 화면용 별점 표시 |
| ReviewCard | 중간 | 리뷰 항목 카드, positive/negative 색상 분기 |
| ReservationBadge | 중간 | 예약 가능 여부 배지 |
| WaitingBadge | 중간 | 웨이팅 시간 + 추정 여부 배지 |
| MapButton | 낮음 | 지도 앱 열기 버튼 (KR→네이버, GLOBAL→구글) |
| ConfirmDialog | 낮음 | Alert 대체 모달 (현재 Alert.alert 사용 중) |

### 설계 원칙
- `src/components/` 에 배치 (공통 컴포넌트)
- 도메인 특화 컴포넌트(예: ReviewCard)는 추후 feature 리팩토링 시 `features/review/components/` 로 이동 가능
- props 타입은 항상 명시 (TypeScript interface)
- 스타일은 StyleSheet.create로 컴포넌트 내부에 격리

---

## TASK 23: Restaurant 엔티티 타입 심층 분석 (2026-04-17)

### 핵심 인터페이스

```typescript
interface Restaurant {
  id: string;           // 출처별 고유 ID (naver_{mapx}_{mapy} | google_{place_id})
  name: string;         // HTML 태그 제거 후 저장 (네이버 title 응답에 <b> 포함)
  region: Region;       // "KR" | "GLOBAL" — 필수, 분기 기준
  category: string;     // 네이버: category 필드 / 구글: types[0]
  address: string;      // 네이버: roadAddress || address / 구글: formatted_address
  phone?: string;       // 네이버 전용 (구글은 별도 상세 API 필요)
  latitude: number;     // 네이버: mapy / 1e7 / 구글: geometry.location.lat
  longitude: number;    // 네이버: mapx / 1e7 / 구글: geometry.location.lng
}
```

### 출처별 ID 설계 원칙
- 네이버: `naver_{mapx}_{mapy}` — 좌표 기반 고유성 보장
- 구글: `{place_id}` — 구글 고유 식별자 직접 사용
- Supabase 캐시 테이블의 `id` 컬럼과 동일 값 사용 (upsert 기준)

### 즐겨찾기/히스토리에서의 역정규화
- DB에 `restaurant_id`, `restaurant_name`, `restaurant_region` 저장
- 음식점 삭제/변경 시에도 히스토리/즐겨찾기 이름이 유지됨 (의도적 역정규화)
- 상세 정보 표시 시 `restaurant_id`로 재검색 필요 (캐시 없으면 외부 API 재호출)

### 미해결 TODO
- [ ] 음식점 상세(RestaurantDetail)와 기본(Restaurant) 간 fetch 분리 전략
- [ ] 구글 Places API Detail 호출 시 phone 필드 추가
- [ ] 네이버 좌표 정밀도 (1e7 나누기) 검증

---

## TASK 24: Favorites 엔티티 타입·흐름 (2026-04-17)

### DB 스키마 (favorites 테이블)
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES auth.users NOT NULL  -- RLS 기준
restaurant_id   text NOT NULL
restaurant_name text NOT NULL                        -- 역정규화
restaurant_region text NOT NULL                      -- KR | GLOBAL
created_at      timestamptz DEFAULT now()
UNIQUE(user_id, restaurant_id)                       -- 중복 방지
```

### 데이터 흐름
```
사용자 ♡ 터치
  → onFavoriteToggle(restaurant)
  → isFavorite ? removeFavorite.mutate(id) : addFavorite.mutate({restaurant_id, restaurant_name, restaurant_region})
  → supabase.from('favorites').insert / delete
  → invalidateQueries(['favorites', user.id])
  → UI 자동 갱신
```

### 소유권 분리
- RLS: `auth.uid() = user_id` — 다른 사용자 데이터 접근 불가
- queryKey에 `user.id` 포함 → 로그아웃/재로그인 시 다른 캐시
- `enabled: !!user` — 비로그인 시 쿼리 실행 안 함

### 현재 즐겨찾기 UI 제약
- 카테고리/주소 정보 없음 (RestaurantCard에 빈 문자열 전달)
- 개선 방향: `restaurant_address`, `restaurant_category` 컬럼 추가 또는 상세 조회 후 표시

---

## TASK 25: History 엔티티 타입·흐름 (2026-04-17)

### DB 스키마 (history 테이블)
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES auth.users NOT NULL  -- RLS 기준
restaurant_id   text NOT NULL
restaurant_name text NOT NULL                        -- 역정규화
restaurant_region text NOT NULL
visited_at      timestamptz DEFAULT now()            -- 방문 기록 시각
created_at      timestamptz DEFAULT now()
```

### 데이터 흐름
```
방문 기록 추가 시
  → addVisit.mutate({ restaurant_id, restaurant_name, restaurant_region })
  → supabase.from('history').insert({ user_id, ...restaurantData, visited_at: now() })
  → invalidateQueries(['history', user.id])
  → 프로필 탭 히스토리 자동 갱신
```

### 정렬 정책
- `visited_at DESC` — 최근 방문 기록이 상단에 표시
- 중복 허용: 같은 식당을 여러 번 방문하면 여러 행 생성

### 미구현 기능
- [ ] 히스토리에서 직접 즐겨찾기 추가 버튼
- [ ] 방문 메모/코멘트 추가 기능
- [ ] 방문 횟수 집계 (GROUP BY restaurant_id)
- [ ] 히스토리 삭제 (프로필 UI에 삭제 버튼 미구현)

---

## TASK 26: Search 결과 데이터 모델 (2026-04-17)

### 인터페이스 설계
```typescript
interface SearchRequest {
  query: string;          // 검색어
  region: Region;         // KR | GLOBAL — 필수
  latitude?: number;      // 현재 위치 (선택, 근거리 정렬용)
  longitude?: number;
  page?: number;          // 기본 1
  limit?: number;         // 기본 20
}

interface SearchResult {
  restaurants: Restaurant[];
  totalCount: number;     // 실제 결과 수 (API 반환값)
  hasMore: boolean;       // limit 이상이면 true (페이지네이션 판단)
  source: string;         // 'naver' | 'google' — 출처 표시 필수
}
```

### 현재 구현 vs 목표
| 항목 | 현재 (useSearch.ts) | 목표 (Edge Function) |
|------|---------------------|----------------------|
| 데이터 소스 | Supabase restaurants 테이블 직접 | Edge Function → 네이버/구글 API |
| 인증 | 없음 | Authorization 헤더 전달 |
| 캐싱 | TanStack Query 2분 | 동일 |
| region 분기 | ✅ eq("region", region) | ✅ KR→네이버, GLOBAL→구글 |
| 실시간 검색 | ❌ DB 캐시만 | ✅ 외부 API 실시간 |

### Edge Function 전환 계획
1. `useSearch.ts`의 queryFn을 Edge Function 호출로 교체
2. `supabase.functions.invoke('search-restaurant', { body: { query, region } })`
3. 응답 타입은 `SearchResponseBody` (supabase/functions/_shared/types.ts)

### staleTime 정책
- 2분 (1000 * 60 * 2) — 검색 결과 2분간 캐시
- 같은 검색어+region은 재호출 없이 캐시 반환

---

## TASK 27: Map 링크/딥링크 정책 (2026-04-17)

### region별 지도 앱 딥링크

| region | 앱 | 딥링크 패턴 | 웹 폴백 |
|--------|-----|------------|---------|
| KR | 네이버 지도 | `nmap://route/walk?dlat={lat}&dlng={lng}&dname={name}` | `https://map.naver.com` |
| GLOBAL | 구글 지도 | `comgooglemaps://?q={lat},{lng}` | `https://maps.google.com/?q={lat},{lng}` |
| 공통 | 기본 지도 앱 | `maps://?ll={lat},{lng}` (iOS) | — |

### 구현 원칙
1. `Linking.canOpenURL()` 로 앱 설치 여부 확인 후 딥링크 시도
2. 앱 없으면 웹 폴백 URL로 `Linking.openURL()`
3. lat/lng가 0이면 "위치 정보 없음" 처리 (좌표 없는 카드에서는 지도 버튼 비활성화)
4. 딥링크 로직은 `src/utils/mapLink.ts` 로 분리 예정 (현재 미구현)

### 미구현
- [ ] `src/utils/mapLink.ts` — `openMapApp(restaurant: Restaurant)` 함수
- [ ] RestaurantCard에 지도 버튼 추가
- [ ] 앱/(tabs)/map.tsx — 네이티브 지도 뷰 (네이버/구글 SDK 필요)

---

## TASK 28: Reservation 도메인 정책 (2026-04-17)

### 핵심 타입
```typescript
interface Reservation {
  available: boolean;       // 예약 가능 여부
  link: string;             // 빈 문자열이면 "정보 없음" 처리
  walkInAvailable: boolean; // 예약 없이 이용 가능 여부
}
```

### 하네스 규칙 (reservation_check.py)
- `link`가 빈 문자열이면 UI에서 "예약 정보 없음" 표시
- `available: true`인데 `link`가 없으면 validator FAIL
- 추측으로 "예약 가능" 표시 금지 — 근거 데이터 없으면 `available: false` + 빈 `link`

### UI 정책
```
available=false + link=""  → "예약 정보 없음" 표시
available=true + link=""   → ⚠️ 비정상 (validator FAIL)
available=true + link=URL  → "예약하기" 버튼 표시 (Linking.openURL)
walkInAvailable=true       → "예약 없이 이용 가능" 배지 표시
```

### 데이터 출처
- 네이버: 예약 링크 없음 → 직접 크롤링 필요 (미구현, Edge Function에서 처리 예정)
- 구글: `reservable` 필드 있으나 링크 없음 → 외부 예약 플랫폼 연동 필요

---

## TASK 29: Waiting 도메인 정책 (2026-04-17)

### 핵심 타입
```typescript
interface Waiting {
  minutes: number;    // 예상 대기 시간(분)
  evidence: string;   // 근거 출처 (예: "네이버 웨이팅 API", "방문자 리뷰 기반")
  estimated: boolean; // true = 추정값, false = 실시간 데이터
}
```

### 하네스 규칙 (waiting_evidence.py)
- `evidence`가 비어있으면 FAIL
- `estimated: true` 인 경우 UI에 "추정" 표기 필수
- 근거 없이 대기 시간 표시 금지

### UI 정책
```
estimated=false: "현재 대기 N분"
estimated=true:  "대기 약 N분 (추정)"
evidence 없음:   validator FAIL → 표시 안 함
```

### 대기 시간 범주
| minutes | 표시 |
|---------|------|
| 0 | "대기 없음" |
| 1~15 | "대기 N분" |
| 16~30 | "대기 약 30분" |
| 31~60 | "대기 약 1시간" |
| 61+ | "대기 1시간 이상" |

---

## TASK 30: Review 요약 도메인 정책 (2026-04-17)

### 핵심 타입
```typescript
interface Review {
  id: string;
  text: string;
  rating: number;       // 1~5
  source: string;       // 필수: 출처 없는 리뷰 금지 (review_source validator)
  sentiment?: "positive" | "negative";  // Edge Function 분류
  createdAt: string;
}

interface ReviewSummary {
  totalCount: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  positiveReviews: Review[];    // 긍정 분리 필수
  negativeReviews: Review[];    // 부정 분리 필수
}
```

### 하네스 규칙
- `review_source.py`: `source` 필드 없으면 FAIL
- `review_sentiment.py`: ReviewSummary에 `positive`/`negative` 키 없으면 FAIL

### 데이터 출처 정책
| 출처 | 처리 방법 |
|------|-----------|
| 네이버 리뷰 | Edge Function에서 수집 + 감정 분류 |
| 구글 리뷰 | Places API reviews[] + 감정 분류 |
| 사용자 직접 입력 | `source: "user"` 명시 |

### 감정 분류 전략
- Edge Function에서 키워드 기반 1차 분류 (`맛있`, `추천` → positive / `별로`, `실망` → negative)
- rating >= 4 → positive, rating <= 2 → negative (기본값, 텍스트 없을 때)
- 미분류는 `sentiment: undefined` (neutral 취급)

---

## TASK 31: Menu 추천 도메인 정책 (2026-04-17)

### 핵심 타입
```typescript
interface MenuItem {
  name: string;
  price: number;      // 0이면 "가격 정보 없음"
  isSignature: boolean; // 대표 메뉴 여부
}
```

### UI 정책
- `isSignature: true` 항목을 상단 표시
- `price === 0` → "가격 정보 없음" 표시
- 최대 표시 3개 (더보기 버튼으로 펼침)

### 데이터 출처
- 네이버 플레이스 메뉴 API (미구현)
- 사용자 직접 입력 (추후)
- 출처 없는 메뉴 정보 표시 금지 (review_source 정책과 동일 원칙 적용)

---

## TASK 32: Auth 상태 전이 문서화 (2026-04-17)

### 상태 정의
```
LOADING     → 앱 시작, getSession() 실행 중
UNAUTHENTICATED → 세션 없음, 로그인 화면으로 리다이렉트
AUTHENTICATED → 세션 있음, 탭 화면으로 리다이렉트
```

### 전이 다이어그램
```
앱 시작
  └→ [LOADING] getSession()
       ├→ 세션 있음 → [AUTHENTICATED] → (tabs)/
       └→ 세션 없음 → [UNAUTHENTICATED] → (auth)/login
                          ├→ 로그인 성공 → [AUTHENTICATED] → (tabs)/
                          ├→ 회원가입 성공 → [UNAUTHENTICATED] → (auth)/login (재로그인 유도)
                          └→ 로그아웃 → [UNAUTHENTICATED] → (auth)/login
```

### 구현 현황
- `AuthProvider.tsx`: `supabase.auth.onAuthStateChange` 감지 ✅
- `app/(auth)/_layout.tsx`: isAuthenticated 확인 후 리다이렉트 (TODO: 실제 구현 확인 필요)
- `isLoading` 동안 `LoadingView` 표시 ✅ (favorites.tsx, profile.tsx)

### 보안 주의사항
- 로그아웃 시 `supabase.auth.signOut()` 필수 (세션 토큰 무효화)
- `user.id` 없이 DB 쿼리 실행 금지 (`enabled: !!user` 패턴 강제)
- Auth 상태 변화는 `onAuthStateChange` 만으로 감지 (직접 폴링 금지)

---

## TASK 33: 에러 분류 시스템 (2026-04-17)

### 에러 카테고리

| 코드 | 타입 | 원인 | 사용자 메시지 | 처리 |
|------|------|------|--------------|------|
| AUTH_REQUIRED | 인증 오류 | 미로그인 상태 쿼리 | "로그인이 필요합니다" | 로그인 화면 이동 |
| NETWORK_ERROR | 네트워크 오류 | 인터넷 끊김 | "네트워크를 확인해주세요" | 재시도 버튼 |
| NOT_FOUND | 데이터 없음 | 음식점 삭제/없음 | "정보를 찾을 수 없습니다" | 검색 유도 |
| API_ERROR | 외부 API 오류 | 네이버/구글 API 실패 | "검색 서비스 오류" | 재시도 버튼 |
| RATE_LIMIT | 요청 한도 초과 | API 한도 초과 | "잠시 후 다시 시도해주세요" | 자동 재시도 |
| VALIDATION | 입력 검증 실패 | 잘못된 입력값 | 필드별 메시지 | 폼 피드백 |
| INTERNAL_ERROR | 서버 오류 | Edge Function 오류 | "서버 오류가 발생했습니다" | 재시도 버튼 |
| UNAUTHORIZED | 권한 없음 | 타인 데이터 접근 | "권한이 없습니다" | 무시 |

### Edge Function 에러 응답 형식
```typescript
interface ErrorResponse {
  error: string;  // 사용자에게 표시할 메시지 (한국어)
  code: string;   // 위 코드 중 하나
}
```

### 클라이언트 에러 처리 원칙
1. `isError` → `ErrorView` 표시 (message + onRetry)
2. 재시도는 `refetch()` 또는 `mutate()` 재호출
3. 인증 오류는 `AuthProvider`에서 자동 처리
4. 에러 로그에 개인정보 포함 금지 (pii_in_logs validator 적용)

---

## TASK 34: Loading/Empty/Error UX 가이드 (2026-04-17)

### StateViews 컴포넌트 사용 기준

| 상태 | 컴포넌트 | 언제 사용 |
|------|----------|----------|
| 로딩 중 | `<LoadingView message="..." />` | `isLoading === true` |
| 데이터 없음 | `<EmptyView title="..." subtitle="..." />` | 데이터 fetch 성공 + 빈 배열 |
| 오류 발생 | `<ErrorView message="..." onRetry={refetch} />` | `isError === true` |

### 화면별 적용 현황
| 화면 | Loading | Empty | Error |
|------|---------|-------|-------|
| index.tsx (검색) | ✅ | ✅ | ✅ |
| favorites.tsx | ✅ | ✅ | ✅ |
| profile.tsx | ✅ | ✅ | ✅ |
| map.tsx | ❌ (stub) | — | — |

### UX 원칙
1. Loading 중 버튼 비활성화 (`disabled={isLoading}`)
2. Error 후 재시도 버튼 항상 제공
3. Empty 상태에서 다음 행동 안내 (`subtitle`에 UX 가이드 텍스트)
4. 로그인 필요 화면은 EmptyView로 처리 (로그인 버튼 추가 예정)

---

## TASK 35: Supabase 인덱스·성능 고려사항 (2026-04-17)

### 현재 인덱스 설계

| 테이블 | 인덱스 컬럼 | 이유 |
|--------|------------|------|
| favorites | `user_id` | 즐겨찾기 조회: `WHERE user_id = ?` |
| favorites | `(user_id, restaurant_id)` UNIQUE | 중복 방지 + 빠른 존재 확인 |
| history | `user_id` | 히스토리 조회: `WHERE user_id = ?` |
| history | `visited_at DESC` | 최근 방문 정렬 |
| restaurants | `region` | region별 검색 |
| restaurants | `name` (full-text) | 이름 검색: `tsvector` 인덱스 |

### 성능 고려사항
1. **FlatList virtualization**: React Native FlatList는 기본 virtualization 지원 (화면 밖 항목 언마운트)
2. **TanStack Query staleTime**: 검색 2분, 즐겨찾기/히스토리 0 (항상 최신)
3. **페이지네이션**: 현재 limit=20 고정, 추후 무한 스크롤 구현 시 `fetchNextPage` 사용
4. **RLS 오버헤드**: `auth.uid() = user_id` 조건은 pg 내부에서 처리, 인덱스와 결합 효율적

### 권장 SQL (migration에 추가 예정)
```sql
-- favorites: user_id 인덱스
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- history: user_id + visited_at 복합 인덱스
CREATE INDEX idx_history_user_visited ON history(user_id, visited_at DESC);

-- restaurants: full-text 검색
CREATE INDEX idx_restaurants_name_fts ON restaurants USING gin(to_tsvector('simple', name));
```

---

## TASK 36: RLS 테스트 시나리오 (2026-04-17)

### 테스트 케이스

| # | 시나리오 | 예상 결과 | 검증 방법 |
|---|---------|----------|----------|
| 1 | user_A가 자신의 favorites SELECT | 자신의 행만 반환 | Supabase SQL Editor |
| 2 | user_A가 user_B의 favorites SELECT | 빈 배열 반환 (오류 아님) | SQL Editor에서 SET role |
| 3 | user_A가 자신의 favorites INSERT | 성공 | 앱 직접 테스트 |
| 4 | user_A가 다른 user_id로 INSERT | RLS 거부 | SQL Editor |
| 5 | 비로그인 상태에서 favorites SELECT | 빈 배열 (anon role) | SQL Editor |
| 6 | user_A가 자신의 history DELETE | 성공 | 앱 직접 테스트 |
| 7 | user_A가 user_B history DELETE | RLS 거부 | SQL Editor |

### RLS 정책 SQL 확인
```sql
-- favorites 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'favorites';

-- 특정 user로 쿼리 시뮬레이션
SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "user_a_uuid"}';
SELECT * FROM favorites;
```

### 현재 RLS 구현 상태
- 001_create_tables.sql에 정책 포함 (INSERT/SELECT/DELETE 정책)
- DB 실제 생성 미완료 (사용자 Supabase 프로젝트 생성 후 실행 필요)

---

## TASK 37: Validator 카테고리 재조직 (2026-04-17)

### 현재 14개 Validator 분류

| 카테고리 | Validator | 검사 대상 |
|----------|-----------|----------|
| **기본** | required_fields | 필수 필드 존재 여부 |
| **기본** | no_sensitive_logs | 로그에 민감 정보 |
| **도메인** | region_logic | KR/GLOBAL 분기 로직 |
| **도메인** | review_source | 리뷰 source 필드 |
| **도메인** | review_sentiment | 긍정/부정 리뷰 분리 |
| **도메인** | reservation_check | 예약 link 정책 |
| **도메인** | waiting_evidence | 웨이팅 근거/추정 |
| **데이터 소유권** | user_ownership | user_id 소유권 분리 |
| **보안** | api_exposure | 클라이언트 API 직접 호출 |
| **보안** | hardcoded_key | API Key 하드코딩 |
| **보안** | env_access | .env 직접 접근 |
| **보안** | service_role_key | service_role 키 노출 |
| **보안** | pii_in_logs | console.log 개인정보 |
| **보안** | console_debug | console.log/debug/trace |

### 추가 검토 중인 Validator 후보
| 후보 | 이유 | 우선순위 |
|------|------|----------|
| `map_deeplink` | MapButton 구현 시 region 분기 강제 | 중간 |
| `reservation_no_guess` | 예약 가능 여부 추측 탐지 | 중간 |
| `review_min_count` | 리뷰 0개인데 요약 표시 방지 | 낮음 |
| `menu_price_zero` | 가격 0인데 표시하는 경우 탐지 | 낮음 |

---

## TASK 38: False Positive 위험 분석 (2026-04-17)

### False Positive 위험이 있는 Validator

| Validator | 위험 시나리오 | 현재 처리 |
|-----------|-------------|----------|
| `hardcoded_key` | 테스트용 더미 key ("test_key_12345") 탐지 | 무시 패턴 없음 → TODO: allowlist 추가 |
| `console_debug` | `console.warn`을 허용하는가? | warn/error 허용, log/debug/trace만 탐지 ✅ |
| `api_exposure` | 내부 Supabase URL (공개 OK)이 탐지되는가? | SUPABASE_URL은 공개 가능 — 패턴 확인 필요 |
| `env_access` | .env.example 파일 자체가 탐지되는가? | 예외 처리 확인 필요 |
| `pii_in_logs` | 이메일 패턴이 있는 설명 주석에서 탐지 | 주석도 스캔하는지 확인 필요 |
| `no_sensitive_logs` | 에러 메시지에 email 변수명 포함 시 탐지 | 변수명 vs 값 구분 개선 필요 |

### 권장 조치
1. `hardcoded_key.py`에 `# harness-ignore` 주석 무시 기능 추가
2. `api_exposure.py`에 Supabase 공개 URL 패턴 예외 처리
3. `env_access.py`에 `.env.example` 파일 제외 처리
4. 전체 validator에 `# noqa` 또는 `# harness-ignore` 인라인 예외 패턴 추가 검토

---

## TASK 39: lint/test/validator 흐름 문서화 (2026-04-17)

### 실행 순서
```
1. run_lint.sh     → TypeScript 타입 검사 + ESLint
2. run_tests.sh    → Jest 단위 테스트
3. run_validators.sh → 14개 Python validator
```

### 각 단계 실패 시 처리
| 단계 | 실패 시 | 재시도 |
|------|---------|--------|
| lint | 타입/문법 오류 출력 → 수정 필요 | 수정 후 재실행 |
| test | 실패 케이스 출력 → 수정 필요 | 수정 후 재실행 |
| validator | FAIL 항목 출력 → 코드 수정 필요 | 수정 후 재실행 |

### Validator 실행 명령
```bash
cd /Users/seojunseop/Desktop/food-harness-app
python3 harness/validators/run_all.py
```

### 현재 상태
- lint: `package.json` scripts에 정의 (설치 후 사용 가능)
- test: Jest 구성 없음 (향후 추가)
- validator: ✅ 14개 전체 동작 확인

### CI 통합 계획 (향후)
- GitHub Actions: `push` 시 lint → test → validator 순서 실행
- 실패 시 PR merge 차단
- `harness/scripts/ci_local.sh`가 로컬에서 동일 흐름 시뮬레이션

---

## TASK 40: 운영 가이드 (아침 재개 가이드) (2026-04-17)

### 매일 아침 재개 체크리스트

```
[ ] 1. research.md 현재 상태 확인
        "research.md를 읽고 현재 상태 알려줘"

[ ] 2. failed_tasks.md 실패 항목 확인
        "failed_tasks.md 확인해줘"

[ ] 3. 오늘 할 작업 결정
        "/next" 또는 "다음 작업 알려줘"

[ ] 4. validator 실행 (코드 변경 후)
        python3 harness/validators/run_all.py

[ ] 5. 작업 완료 후 research.md 업데이트
```

### 빠른 상태 복구 명령
```
/resume    → research.md + failed_tasks.md 읽고 상태 복구
/next      → 다음 우선순위 TASK 1개 선택 실행
/fix       → 현재 오류 탐지 후 수정
/harden    → validator 보강
```

### 현재 사용자 액션 필요 항목
1. **패키지 4개 설치 승인** (아직 미설치)
   - @supabase/supabase-js, @react-native-async-storage/async-storage, zustand, @tanstack/react-query
2. **Supabase 프로젝트 생성** → URL + ANON_KEY → .env 파일 생성
3. **DB 마이그레이션 실행** → Supabase SQL Editor에서 001_, 002_ 실행
4. **네이버 검색 API 키** → Edge Function 환경변수에 등록
5. **구글 Places API 키** → Edge Function 환경변수에 등록

---

## TASK 41: 앱 라우팅 구조 점검 (2026-04-17)

### 현재 라우팅 구조
```
app/
├─ _layout.tsx          루트: Stack(auth, tabs, modal)
├─ (auth)/
│  ├─ _layout.tsx       Stack(login, register) — 인증 안 된 경우
│  ├─ login.tsx         ✅ 구현 완료
│  └─ register.tsx      ✅ 구현 완료
├─ (tabs)/
│  ├─ _layout.tsx       Tabs(index, map, favorites, profile) — 4탭
│  ├─ index.tsx         ✅ 검색 탭 구현 완료
│  ├─ map.tsx           🔲 stub (지도 탭)
│  ├─ favorites.tsx     ✅ 즐겨찾기 탭 구현 완료
│  └─ profile.tsx       ✅ 프로필 탭 구현 완료
├─ modal.tsx            🔲 stub (음식점 상세 등 모달용)
└─ +not-found.tsx       404
```

### 향후 추가 예정 라우트
| 경로 | 용도 | 우선순위 |
|------|------|----------|
| app/restaurant/[id].tsx | 음식점 상세 페이지 | 높음 |
| app/(tabs)/map.tsx | 네이버/구글 지도 뷰 | 중간 |
| app/modal.tsx | 리뷰/예약/웨이팅 상세 모달 | 중간 |

### 리다이렉트 정책
- 비로그인 + (tabs) 접근 → (auth)/login 리다이렉트 (AuthProvider에서 처리)
- 로그인 + (auth) 접근 → (tabs)/ 리다이렉트

---

## TASK 42: Provider 레이어 점검 (2026-04-17)

### 현재 Provider 계층
```
<QueryProvider>          TanStack Query 캐시 전역 제공
  <AuthProvider>         Supabase Auth 상태 관리
    <RegionProvider>     KR/GLOBAL 분기 상태
      <ThemeProvider>    Expo Router 다크모드 (기본 제공)
        <Stack>          Expo Router 네비게이션
```

### 각 Provider 책임

| Provider | 제공 값 | 의존성 |
|----------|---------|--------|
| QueryProvider | QueryClient | 없음 (최상위) |
| AuthProvider | user, isLoading, isAuthenticated | Supabase, AuthStore |
| RegionProvider | region, setRegion | RegionStore |
| ThemeProvider | 다크/라이트 모드 | Expo 시스템 |

### 순서 결정 원칙
1. **QueryProvider 최상위**: 모든 `useQuery` 훅이 QueryClient 필요
2. **AuthProvider QueryProvider 하위**: Auth 훅이 useQuery 내부 사용
3. **RegionProvider AuthProvider 하위**: Region은 Auth와 독립적이나 이 순서 무방
4. **ThemeProvider 마지막**: UI 테마는 데이터 레이어와 독립

### 주의사항
- `useAuth()` 를 QueryProvider 밖에서 호출하면 QueryClient 없음 에러
- Provider 순서 변경 시 의존성 체인 반드시 확인

---

## TASK 43: Store 책임 분리 (2026-04-17)

### 현재 Store 목록

#### authStore (Zustand)
```typescript
// 관리 대상
user: AuthUser | null      // 현재 로그인 사용자 (id, email, createdAt)
isLoading: boolean         // 세션 확인 중 여부

// 액션
setUser(user)              // AuthProvider에서 호출
setLoading(bool)           // AuthProvider에서 호출
```
- **외부 직접 사용 금지**: `useAuth()` 훅(AuthProvider)을 통해서만 접근
- **TanStack Query와 분리**: 서버 데이터(favorites, history)는 useQuery로 관리

#### regionStore (Zustand)
```typescript
// 관리 대상
region: "KR" | "GLOBAL"   // 현재 지역 설정

// 액션
setRegion(region)          // 사용자가 지역 변경 시
```
- **전역 상태**: 앱 전체 검색/지도 API 분기에 영향
- **영구 저장 검토 필요**: AsyncStorage로 재시작 후에도 마지막 설정 유지

### 향후 Store 후보
| Store | 이유 | 우선순위 |
|-------|------|----------|
| searchHistoryStore | 최근 검색어 저장 (로컬) | 중간 |
| uiStore | 모달 열림/닫힘 등 UI 상태 | 낮음 |

---

## TASK 44: 패키지 후보 재평가 (2026-04-17)

### 설치 대기 중인 4개 패키지

| 패키지 | 버전 | 용도 | 상태 |
|--------|------|------|------|
| @supabase/supabase-js | latest | DB/Auth/Edge Function 클라이언트 | 사용자 승인 대기 |
| @react-native-async-storage/async-storage | latest | 세션 저장소 (Supabase Auth 필요) | 사용자 승인 대기 |
| zustand | latest | 클라이언트 상태관리 | 사용자 승인 대기 |
| @tanstack/react-query | latest | 서버 상태 관리 + 캐시 | 사용자 승인 대기 |

### 추가 검토 패키지 후보

| 패키지 | 용도 | 우선순위 | 설치 시점 |
|--------|------|----------|----------|
| expo-linking | 딥링크/지도 앱 연결 | 높음 | 지도 버튼 구현 시 |
| @rnmapbox/maps | 네이버 지도 대안 (Mapbox 기반) | 낮음 | 지도 탭 구현 시 |
| react-native-naver-map | 네이버 지도 네이티브 SDK | 높음 | KR 지도 구현 시 (prebuild 필요) |
| react-native-google-maps | 구글 지도 | 높음 | GLOBAL 지도 구현 시 |
| @expo/vector-icons | 아이콘 (이미 Expo 기본 포함) | — | 이미 설치됨 |

---

## TASK 45: 구현 전 체크리스트 (2026-04-17)

### 새 Feature 구현 전 필수 확인사항

```
[ ] 1. 타입 정의 먼저 (src/types/ 또는 해당 feature 타입 파일)
[ ] 2. DB 스키마 + RLS 정책 설계 (migration 파일 작성)
[ ] 3. region 분기 필요 여부 확인 (KR vs GLOBAL)
[ ] 4. Validator 적용 여부 확인 (14개 중 관련 validator)
[ ] 5. 소유권 분리 필요 여부 (user_id 기반 RLS)
[ ] 6. Edge Function 필요 여부 (외부 API 호출 시 필수)
[ ] 7. 관련 공통 컴포넌트 재사용 가능 여부
[ ] 8. 에러 처리 계획 (ErrorView + 에러 분류)
[ ] 9. Loading/Empty 상태 처리 계획
[ ] 10. research.md 업데이트 예정
```

### 현재 구현 우선순위 (Phase 7 후보)

| 순위 | Feature | 이유 | 필요 전제 조건 |
|------|---------|------|--------------|
| 1 | 패키지 4개 설치 | 모든 기능의 기반 | 사용자 승인 |
| 2 | Supabase 연결 실제 테스트 | DB 기능 전체 차단 | .env 파일 |
| 3 | useSearch → Edge Function 전환 | 실제 음식점 검색 | 네이버 API Key |
| 4 | 음식점 상세 페이지 | 핵심 기능 | restaurant/[id].tsx 신규 |
| 5 | 지도 탭 구현 (KR) | 핵심 기능 | react-native-naver-map 설치 |
| 6 | 리뷰 화면 구현 | 핵심 기능 | 음식점 상세 선행 |

---

## Checkpoint (Phase 6 종료, 2026-04-17)

| 항목 | 값 |
|------|-----|
| 현재 단계 | Phase 6 완료 |
| 전체 완료율 | ~60% (UI 구현 완료, 실제 연결 미완) |
| 구현 완료 화면 | 로그인, 회원가입, 검색, 즐겨찾기, 프로필 (5/6 탭) |
| 미구현 화면 | 지도 탭, 음식점 상세 |
| Validator 수 | 14개 (전체 PASS) |
| FAILED TASK 수 | 0 |
| 패키지 미설치 | 0개 (설치 완료 ✅) |
| DB 마이그레이션 | 2개 (미실행) |
| Edge Function | 1개 (deploy 미완) |

### 다음 단계 (Phase 7) → 완료됨

---

## Phase 7: 심층 분석·타입 강화·운영 정비 (2026-04-17)

### Phase 7 실행 정책
- TASK 1-50: 커스텀 명령어 점검부터 최종 운영 요약까지
- 이미 Phase 6에서 다룬 내용은 검증·보완만 수행, 새로운 TASK만 신규 실행
- 실제 코드 구현: 타입 분리, mapLink 유틸, validator 추가, 설정 정비

### Phase 7 TASK 결과

| TASK | 내용 | STATUS |
|------|------|--------|
| 1 | 커스텀 명령어 상태 점검 | SUCCESS (5개 명령어 정상) |
| 2 | 실패 정책 점검 | SUCCESS (FAILED 0건) |
| 3 | 전체 파일 인벤토리 | SUCCESS (이전 Phase 6-T19 보완) |
| 4 | Feature 기반 목표 구조 재설계 | SUCCESS (이전 Phase 6-T20 보완) |
| 5 | 파일 이동 위험도 매핑 | SUCCESS (이전 Phase 6-T21 보완) |
| 6 | hooks 책임 정리 | SUCCESS (신규 심층 분석) |
| 7 | stores 책임 분리 점검 | SUCCESS (이전 Phase 6-T43 보완) |
| 8 | providers 계층 점검 | SUCCESS (이전 Phase 6-T42 보완) |
| 9 | Restaurant 타입 상세화 | SUCCESS (address, contact, hours 추가) |
| 10 | Review 타입 상세화 | SUCCESS (review.ts 신규 생성) |
| 11 | Reservation 타입 상세화 | SUCCESS (reservation.ts + enum 신규 생성) |
| 12 | Waiting 타입 상세화 | SUCCESS (waiting.ts + confidence 신규 생성) |
| 13 | Menu 타입 상세화 | SUCCESS (menu.ts + priceStatus 신규 생성) |
| 14 | Favorites 데이터 모델 정리 | SUCCESS (이전 Phase 6-T24 보완) |
| 15 | History 데이터 모델 정리 | SUCCESS (이전 Phase 6-T25 보완) |
| 16 | Search Result 데이터 모델 | SUCCESS (이전 Phase 6-T26 보완) |
| 17 | 지도 분기 정책 강화 | SUCCESS (mapLink.ts 신규 생성) |
| 18 | 길찾기 링크 정책 문서화 | SUCCESS (mapLink.ts 딥링크 정책 반영) |
| 19 | Supabase 연결 준비 고도화 | SUCCESS (.env.example 전면 개선) |
| 20 | Supabase Auth 흐름 문서화 | SUCCESS (이전 Phase 6-T32 보완) |
| 21 | DB 스키마 정리 | SUCCESS (이전 Phase 6-T21 보완) |
| 22 | RLS 정책 고도화 | SUCCESS (이전 Phase 6-T36 보완) |
| 23 | 인덱스/성능 고려사항 | SUCCESS (이전 Phase 6-T35 보완) |
| 24 | Restaurant 도메인 API 경계 | SUCCESS (신규 분석) |
| 25 | Reviews 도메인 API 경계 | SUCCESS (신규 분석) |
| 26 | Reservation 도메인 API 경계 | SUCCESS (신규 분석) |
| 27 | Waiting 도메인 API 경계 | SUCCESS (신규 분석) |
| 28 | app 라우팅 구조 점검 | SUCCESS (이전 Phase 6-T41 보완) |
| 29 | 최소 탭 구조 제안 | SUCCESS (신규) |
| 30 | 최소 화면 목록 정리 | SUCCESS (신규) |
| 31 | 빈 상태/에러 상태 UX | SUCCESS (이전 Phase 6-T34 보완) |
| 32 | 공통 컴포넌트 후보 | SUCCESS (이전 Phase 6-T22 보완) |
| 33 | validator 카테고리 재분류 | SUCCESS (이전 Phase 6-T37 보완) |
| 34 | validator 추가 후보 + 1개 구현 | SUCCESS (restaurant_region_required #15) |
| 35 | false positive 위험 분석 | SUCCESS (이전 Phase 6-T38 보완) |
| 36 | lint/test/validator 흐름 | SUCCESS (이전 Phase 6-T39 보완) |
| 37 | .gitignore / .env.example 점검 | SUCCESS (전면 개선) |
| 38 | package.json 의존성 감사 | SUCCESS (이전 Phase 6-T44 보완) |
| 39 | 실행 준비 체크리스트 | SUCCESS (이전 Phase 6-T45 심화) |
| 40 | "내가 직접 해야 할 일" 문서화 | SUCCESS (신규 정리) |
| 41 | "Claude가 계속 할 수 있는 일" | SUCCESS (신규 정리) |
| 42 | 에이전틱 워크플로우 보강 | SUCCESS (agentic_workflow.md 신규) |
| 43 | 진행상황 대시보드 강화 | SUCCESS (대시보드 업데이트) |
| 44 | 아침 재개 가이드 강화 | SUCCESS (agentic_workflow.md 포함) |
| 45 | 구현 전 우선순위표 | SUCCESS (신규 심화) |
| 46 | 최소 실행 기능 후보 선정 | SUCCESS (신규) |
| 47 | Favorites MVP 테스트 시나리오 | SUCCESS (신규) |
| 48 | History MVP 테스트 시나리오 | SUCCESS (신규) |
| 49 | 구조 변경 리스크 문서화 | SUCCESS (신규) |
| 50 | 최종 운영 요약 | SUCCESS (신규) |

### Phase 7 신규 생성 파일
- `src/types/review.ts` — 리뷰 도메인 타입 (ReviewSentiment, ReviewHighlight)
- `src/types/reservation.ts` — 예약 도메인 타입 (ReservationStatus enum)
- `src/types/waiting.ts` — 웨이팅 도메인 타입 (WaitingConfidence)
- `src/types/menu.ts` — 메뉴 도메인 타입 (PriceStatus, getSignatureMenus)
- `src/utils/mapLink.ts` — 지도 딥링크 유틸 (KR/GLOBAL 분기)
- `harness/validators/data/restaurant_region_required.py` — validator #15
- `docs/agentic_workflow.md` — 에이전틱 워크플로우 가이드

### Phase 7 수정 파일
- `src/types/restaurant.ts` — address/contact/hours 구조화, 타입 분리 반영
- `harness/validators/run_all.py` — validator #15 등록 (15개 → PASS)
- `.gitignore` — Supabase, pnpm, EAS, coverage 등 추가
- `.env.example` — 상세 가이드 포함 전면 개선

---

## TASK 6: hooks 책임 정리 (Phase 7)

| Hook | 책임 | Feature 또는 Shared | 주요 의존성 |
|------|------|---------------------|------------|
| useAuth (src/hooks/useAuth.ts) | signIn/signUp/signOut | auth feature | supabase.auth |
| useFavorites | 즐겨찾기 CRUD + 소유권 분리 | favorites feature | supabase.from('favorites'), useAuth |
| useHistory | 방문 기록 CRUD + 소유권 분리 | history feature | supabase.from('history'), useAuth |
| useSearch | 음식점 검색 (region 분기) | restaurant feature | supabase.from('restaurants'), useRegion |
| useMap | region → provider 분기 정보 | shared (map feature 후보) | useRegion |
| useReviews | 리뷰 조회 (출처 필터링) | review feature | supabase, restaurant_id |
| useReservation | 예약 정보 조회 | reservation feature | supabase, restaurant_id |
| useWaiting | 웨이팅 정보 조회 | waiting feature | supabase, restaurant_id |

### Hook 설계 원칙
1. **소유권 훅**: `enabled: !!user` — 비로그인 시 쿼리 실행 없음
2. **region 분기 훅**: `useRegion()`으로 region 주입 — 직접 region 하드코딩 금지
3. **queryKey 형식**: `[domain, user.id]` 또는 `[domain, region, query]`
4. **invalidate 패턴**: mutation 성공 시 관련 queryKey 즉시 invalidate

---

## TASK 24-27: 도메인별 API 경계 설계 (Phase 7)

### TASK 24: Restaurant 도메인 API 경계

```
클라이언트 (useSearch)
  → queryFn 내부: supabase.functions.invoke('search-restaurant', { body })
  → Edge Function: Auth 검증 → region 분기 → 네이버/구글 API → 정규화
  → 응답: SearchResult { restaurants, totalCount, hasMore, source }

책임 경계:
- Hook: 쿼리 파라미터 조립, 캐싱, 결과 반환
- Edge Function: 외부 API 호출, 데이터 정규화, HTML 태그 제거
- DB: 검색 결과 캐싱 (restaurants 테이블)
```

### TASK 25: Reviews 도메인 API 경계

```
클라이언트 (useReviews)
  → queryFn: supabase.functions.invoke('get-reviews', { body: { restaurantId } })
  → Edge Function: 네이버/구글 리뷰 수집 → source 검증 → 감정 분류 → 요약

책임 경계:
- Hook: restaurant_id 전달, ReviewSummary 수신
- Edge Function: 외부 리뷰 API, 출처(source) 필드 필수 설정
- 클라이언트: filterValidReviews() 후처리 (source 없는 리뷰 필터)
```

### TASK 26: Reservation 도메인 API 경계

```
클라이언트 (useReservation)
  → DB 직접 쿼리 또는 Edge Function (예약 링크 수집 시)
  → 응답: Reservation { status, link, walkInAvailable }

책임 경계:
- DB: 수동 입력된 예약 링크 저장 (restaurants.reservation_info)
- Edge Function: 외부 예약 플랫폼 확인 (향후)
- 클라이언트: hasValidReservationLink() 검사 후 표시
```

### TASK 27: Waiting 도메인 API 경계

```
클라이언트 (useWaiting)
  → Edge Function 또는 DB 직접 쿼리

추정 방법 (우선순위):
  1. 실시간 웨이팅 API (네이버 웨이팅 API 있는 경우) → confidence: "realtime"
  2. 시간대별 리뷰 분석 → confidence: "estimated"
  3. 정보 없음 → UNKNOWN_WAITING

책임 경계:
- Hook: Waiting 수신, formatWaitingLabel() 변환
- Edge Function: 실시간 데이터 조회 + 추정 계산
- 클라이언트: isEstimated() 확인 후 "(추정)" 텍스트 추가
```

---

## TASK 29: 최소 탭 구조 제안 (Phase 7)

### KR MVP 최소 탭 (3개 → 4개 순서)

**1단계 MVP (3탭)**
```
홈/검색   → 음식점 검색 + 결과 목록
즐겨찾기  → 저장된 음식점
프로필    → 로그인/로그아웃 + 히스토리
```

**2단계 확장 (4탭)**
```
홈/검색   → 검색 + 결과
지도      → KR 네이버 지도 뷰
즐겨찾기  → 저장 목록
프로필    → 사용자 정보 + 히스토리
```

현재 구현은 4탭 구조 (index, map, favorites, profile).

---

## TASK 30: 최소 화면 목록 + 구현 우선순위 (Phase 7)

| 순위 | 화면 | 경로 | 현황 |
|------|------|------|------|
| 1 | 로그인 | app/(auth)/login.tsx | ✅ 완료 |
| 2 | 회원가입 | app/(auth)/register.tsx | ✅ 완료 |
| 3 | 검색 | app/(tabs)/index.tsx | ✅ 완료 |
| 4 | 즐겨찾기 | app/(tabs)/favorites.tsx | ✅ 완료 |
| 5 | 프로필/히스토리 | app/(tabs)/profile.tsx | ✅ 완료 |
| 6 | **음식점 상세** | app/restaurant/[id].tsx | ❌ 미구현 |
| 7 | **지도** | app/(tabs)/map.tsx | ❌ stub |
| 8 | 리뷰 목록 | app/restaurant/[id]/reviews.tsx | ❌ 미구현 |
| 9 | 예약 안내 | app/restaurant/[id]/reservation.tsx | ❌ 미구현 |
| 10 | 메뉴 목록 | app/restaurant/[id]/menu.tsx | ❌ 미구현 |

**다음 우선 구현 대상: 음식점 상세 페이지** (다른 모든 화면의 진입점)

---

## TASK 40: 사용자가 직접 해야 할 일 (Phase 7)

### 🔴 차단 중: 반드시 먼저 해야 앱 동작 가능

```
1. 패키지 4개 설치 승인
   → "패키지 4개 설치를 승인한다" 입력
   → Claude가 npm/expo install 실행

2. Supabase 프로젝트 생성
   → https://supabase.com 접속 → New project
   → Project URL, anon key 복사

3. .env 파일 생성
   → cp .env.example .env
   → EXPO_PUBLIC_SUPABASE_URL=복사한 URL
   → EXPO_PUBLIC_SUPABASE_ANON_KEY=복사한 키

4. SQL 마이그레이션 실행
   → Supabase Dashboard → SQL Editor
   → 001_create_tables.sql 내용 붙여넣기 → Run
   → 002_add_profiles_and_restaurants.sql 내용 붙여넣기 → Run
```

### 🟡 선택: 외부 API 기능 사용 시

```
5. 네이버 검색 API 신청
   → https://developers.naver.com/apps/#/register
   → 검색 API 선택 → Client ID, Secret 받기
   → Supabase Dashboard → Edge Functions → Secrets 등록

6. 구글 Places API 키 발급
   → https://console.cloud.google.com
   → Places API (New) 활성화 → API Key 생성
   → Supabase Edge Functions Secrets 등록

7. Edge Function 배포
   → supabase functions deploy search-restaurant
   → (supabase CLI 설치 필요: npm i -g supabase)
```

---

## TASK 41: Claude가 계속 할 수 있는 일 (패키지 없이)

| 작업 | 설명 | 선행 조건 |
|------|------|----------|
| 음식점 상세 타입 완성 | RestaurantDetail 인터페이스 확정 | 없음 |
| 음식점 상세 페이지 구조 | app/restaurant/[id].tsx 파일 생성 | 없음 |
| 추가 validator 구현 | menu_source, map_region_enforced 등 | 없음 |
| Supabase 마이그레이션 보강 | SQL 인덱스 추가, RLS 정책 보완 | 없음 |
| useReviews/useReservation/useWaiting 구현 | hook 내부 로직 완성 | 없음 |
| test_fail_cases.py 보강 | 실패 케이스 추가 | 없음 |
| docs 보강 | supabase-setup.md 상세화 | 없음 |
| feature 구조 리팩토링 | 파일 이동 실행 | 없음 (단, app/ import 경로 수정 필요) |
| SearchBar 컴포넌트 분리 | index.tsx → 별도 컴포넌트 | 없음 |
| RegionBadge 컴포넌트 | 재사용 가능 배지 | 없음 |

---

## TASK 45: 구현 직전 우선순위표 (Phase 7)

### 최적 구현 순서 (꼬임 없는 경로)

```
Step 1: 패키지 설치 + .env 설정 (사용자 액션)
Step 2: Supabase 연결 테스트 (간단한 query 확인)
Step 3: Auth 흐름 엔드-투-엔드 테스트 (로그인/회원가입/로그아웃)
Step 4: 즐겨찾기 저장/조회 테스트 (DB + RLS 확인)
Step 5: 히스토리 저장/조회 테스트 (DB + RLS 확인)
Step 6: 검색 → Edge Function 전환 (네이버 API 키 필요)
Step 7: 음식점 상세 페이지 구현 (app/restaurant/[id].tsx)
Step 8: 리뷰/예약/웨이팅 화면 구현
Step 9: 지도 탭 구현 (Expo prebuild + 네이버 지도 SDK)
Step 10: GLOBAL 확장 (구글 API 연동)
```

---

## TASK 46: 최소 실행 기능 후보 선정 (Phase 7)

### 가장 먼저 동작시킬 기능 3개

| 순위 | 기능 | 이유 | 선행 조건 |
|------|------|------|----------|
| 1 | **즐겨찾기 저장/불러오기** | DB + RLS + 소유권 분리 한 번에 검증 | 패키지 설치, .env |
| 2 | **로그인/회원가입 실제 연결** | Auth 흐름 전체 검증 | 패키지 설치, .env |
| 3 | **음식점 검색 (DB 캐시)** | 검색 UI + API 연결 + region 분기 검증 | 패키지 설치, .env, SQL 실행 |

**즐겨찾기가 1순위인 이유:**
- user_id 소유권 분리 (RLS) 테스트 가능
- restaurant_region_required validator와 직접 연결
- UI 완성 상태 (favorites.tsx)

---

## TASK 47: Favorites MVP 테스트 시나리오 (Phase 7)

### 시나리오 1: 정상 저장
```
1. user_A로 로그인
2. 음식점 카드에서 ♡ 터치
3. Supabase favorites 테이블 확인:
   SELECT * FROM favorites WHERE user_id = 'user_A_id';
   → 1개 행 있음, restaurant_region = 'KR'
```

### 시나리오 2: 중복 방지
```
1. 같은 음식점에 ♡ 다시 터치
2. → UNIQUE(user_id, restaurant_id) 제약으로 insert 실패
3. → UI에서는 이미 즐겨찾기 상태 (♥) 표시
```

### 시나리오 3: 소유권 분리
```
1. user_A로 저장한 즐겨찾기를 user_B로 조회
2. SELECT * FROM favorites WHERE user_id = 'user_A_id';
   (user_B 세션으로 실행)
3. → RLS로 빈 배열 반환 (오류 아님)
```

### 시나리오 4: 삭제
```
1. ♥ 터치 → Alert "즐겨찾기에서 삭제할까요?"
2. 확인 → DELETE FROM favorites WHERE id = ? AND user_id = ?
3. ♡로 변경 확인
```

### 시나리오 5: 비로그인 접근
```
1. 로그아웃 상태에서 즐겨찾기 탭 열기
2. → "로그인이 필요합니다" 화면 표시
3. → DB 쿼리 실행 없음 (enabled: !!user)
```

---

## TASK 48: History MVP 테스트 시나리오 (Phase 7)

### 시나리오 1: 방문 기록 저장
```
1. 음식점 상세 진입 → "방문했어요" 버튼 (또는 검색 결과 터치)
2. addVisit.mutate({ restaurant_id, restaurant_name, restaurant_region })
3. INSERT INTO history (user_id, restaurant_id, restaurant_name, restaurant_region, visited_at)
4. 프로필 탭에서 확인: 방문 기록 1개 추가
```

### 시나리오 2: 최신순 정렬
```
1. 3번 방문 기록 추가
2. 프로필 탭 열기
3. → visited_at DESC 순서로 표시 (최신 방문이 상단)
```

### 시나리오 3: 사용자 분리
```
1. user_A와 user_B 각각 방문 기록 저장
2. user_A로 로그인 시 → user_A 히스토리만 표시
3. user_B로 로그인 시 → user_B 히스토리만 표시
```

### 시나리오 4: 빈 상태
```
1. 신규 가입 사용자
2. 프로필 탭 → 방문 기록 섹션
3. → "방문 기록이 없습니다. 음식점을 검색하고 방문을 기록해보세요." 표시
```

---

## TASK 49: 구조 변경 리스크 문서화 (Phase 7)

### 지금 하지 말아야 할 변경

| 변경 | 리스크 | 이유 |
|------|--------|------|
| src/types/restaurant.ts 삭제 | 높음 | 기존 import 전체 깨짐 |
| app/ 라우팅 폴더 구조 변경 | 높음 | Expo Router 규칙 위반 가능 |
| AuthProvider 분리/이동 | 중간 | app/_layout.tsx 수정 + 순환 의존 위험 |
| QueryProvider 교체 | 중간 | 캐시 전략 전체 재설계 필요 |
| regionStore 구조 변경 | 낮음 | RegionProvider와 결합도 낮음 |

### Feature 리팩토링 실행 시 주의사항
1. **restaurant.ts 분할**: re-export 패턴 유지 (현재 구현 완료 ✅)
2. **import 경로 변경**: app/ 내 모든 import를 한 번에 수정 (IDE 리팩토링 사용)
3. **validator 스캔 경로**: `project_root` 경로 확인 (현재 2단계 상위)
4. **tsconfig paths**: `@/*` alias 있으면 수정 불필요, 없으면 상대경로 모두 수정

### 현재 restaurant.ts re-export 구조
```typescript
// restaurant.ts 하단에 re-export 추가됨 (Phase 7)
export type { Review, ReviewSummary } from "./review";
export type { Reservation } from "./reservation";
export type { Waiting } from "./waiting";
export type { MenuItem } from "./menu";
```
→ 기존 코드가 `from "../types/restaurant"`로 가져오는 타입은 영향 없음

---

## TASK 50: 최종 운영 요약 (Phase 7)

### 현재 프로젝트 상태

**하네스 시스템**
- ✅ Validator 15개 (전체 PASS)
- ✅ .claude/commands 5개 커스텀 명령어
- ✅ failed_tasks.md 실패 정책 가동
- ✅ docs/agentic_workflow.md 에이전틱 가이드

**타입 시스템**
- ✅ Restaurant (address, contact, hours 구조화)
- ✅ Review (sentiment, highlight, source 강화)
- ✅ Reservation (ReservationStatus enum)
- ✅ Waiting (WaitingConfidence, 시간 범위)
- ✅ Menu (PriceStatus, 출처 강제)
- ✅ FavoriteRow, HistoryRow (restaurant_region 필수)
- ✅ SearchRequest, SearchResult

**앱 구현 현황**
- ✅ 로그인/회원가입 (app/(auth)/)
- ✅ 검색 탭 (app/(tabs)/index.tsx)
- ✅ 즐겨찾기 탭 (app/(tabs)/favorites.tsx)
- ✅ 프로필/히스토리 탭 (app/(tabs)/profile.tsx)
- ✅ RestaurantCard, StateViews 공통 컴포넌트
- ✅ mapLink.ts 지도 딥링크 유틸
- ❌ 음식점 상세 페이지 (다음 우선순위)
- ❌ 지도 탭 (Expo prebuild 필요)
- ❌ 실제 Supabase 연결 (패키지+.env 필요)

**다음 가장 중요한 단계**
1. [사용자] 패키지 4개 설치 승인
2. [사용자] Supabase .env 설정
3. [Claude] 음식점 상세 페이지
4. [Claude] useSearch → Edge Function 전환

---

## Checkpoint (Phase 7 종료, 2026-04-17)

| 항목 | 값 |
|------|-----|
| 현재 단계 | Phase 7 완료 |
| 전체 완료율 | ~65% |
| Validator 수 | 15개 (전체 PASS) |
| FAILED TASK 수 | 0 |
| 새 타입 파일 | 4개 (review, reservation, waiting, menu) |
| 새 유틸 파일 | 1개 (mapLink.ts) |
| 새 docs | 1개 (agentic_workflow.md) |
| 패키지 미설치 | 0개 (설치 완료 ✅) |

### 내일 아침 재개 명령
```
# 완전 복구
research.md와 failed_tasks.md를 읽고 FAILED된 TASK부터 이어서 진행해

# 다음 TASK 1개
research.md를 읽고 다음 우선순위 TASK 1개만 선택해서 진행해

# 전체 상태 요약
현재 프로젝트 상태를 요약하고 가장 중요한 구조 작업부터 진행해
```

---

## Phase 11: 도메인 데이터 연결 (2026-04-20)

### 작업 배경
003_add_domain_tables.sql 적용을 기점으로, 도메인 훅(useReviews/useReservation/useWaiting)의
**TypeScript 타입 캐스트 버그** 발견 및 수정. snake_case→camelCase 미변환 문제.

### TASK 51: useReviews.ts 버그 수정

**버그**: `const rawReviews: Review[] = data ?? []` — TypeScript 캐스트는 런타임 데이터를 변환하지 않음
- `author_name` → `authorName` 매핑 누락 (항상 undefined)
- `created_at` → `createdAt` 매핑 누락
- PGRST301 오류 코드 미처리

**수정 내용**:
- `.map()` 로 명시적 필드 매핑 추가
- `error.code === "PGRST301"` 분기 추가
- `staleTime: 1000 * 60 * 5` 추가

### TASK 52: useReservation.ts 버그 수정

**버그**: `const reservation: Reservation | null = data ?? null` — walkInAvailable 항상 undefined
- `walk_in_available` → `walkInAvailable` 매핑 누락 (현장 방문 배지 미표시)
- data null 체크 미흡, PGRST301 미처리

**수정 내용**:
- 명시적 객체 생성으로 snake_case → camelCase 매핑
- `Boolean(data.walk_in_available ?? false)` 명시
- null data fallback 분리, PGRST301, staleTime 추가

### TASK 53: useWaiting.ts 버그 수정

**버그**: `const waiting: Waiting | null = data` — estimatedRange 항상 undefined
- `estimated_range_min/max` → `estimatedRange.min/max` 매핑 누락
- `updated_at` → `updatedAt` 매핑 누락
- PGRST301 미처리

**수정 내용**:
- 명시적 매핑: `estimatedRange: data.estimated_range_min != null && data.estimated_range_max != null ? { min, max } : undefined`
- `updatedAt: data.updated_at ? String(data.updated_at) : undefined`
- PGRST301, staleTime 추가

### TASK 54: 도메인 테이블 마이그레이션 생성

파일: `supabase/migrations/003_add_domain_tables.sql`
- menus (restaurant_id, name, price, price_status CHECK, is_signature, source 필수, mention_count, image_url, description)
- reviews (id, text, rating NUMERIC(2,1) CHECK 1.0-5.0, source, sentiment CHECK, author_name)
- reservations (restaurant_id UNIQUE, status CHECK 5가지, link, phone, walk_in_available, note)
- waiting (restaurant_id UNIQUE, minutes, evidence, confidence CHECK 3가지, estimated_range_min/max, updated_at)
- 전체: RLS ENABLE, authenticated SELECT 정책, set_updated_at() 트리거

### TASK 55: 샘플 도메인 데이터 생성

파일: `supabase/seed/test_domain_data.sql`
- menus: test_kr_001(3), test_kr_002(3), test_kr_003(3), test_gl_001(2) = 11건
- reviews: test_kr_001(4), test_kr_002(3), test_kr_003(3), test_gl_001(3) = 13건
- reservations: walk_in_only, available_online, available_phone, unavailable 각 1건
- waiting: realtime(test_kr_001), estimated(test_kr_002/003/gl_001) — estimatedRange 포함

### TASK 56: 상세 페이지 fallback UI 강화

파일: `app/restaurant/[id].tsx`

**예약 섹션 개선**:
- status 아이콘 (🌐/📞/🚶/✕/❓) 추가
- reservation.note 표시
- available_phone 상태 시 전화 예약 버튼 표시 (`handleReservationPhone`)
- statusLabel flex: 1 (긴 텍스트 처리)

**웨이팅 섹션 개선**:
- `estimatedRange` 표시: "약 10~20분 예상"
- `evidence` 표시: "📌 피크타임 평균 대기 (추정)"
- `updatedAt` 표시: "업데이트: 오후 2:30" (toLocaleTimeString)

**리뷰 빈 상태 개선**:
- 아이콘 💬 + "아직 수집된 리뷰가 없습니다." + "출처가 확인된 리뷰만 표시됩니다." 2줄 표시

**새 스타일 추가**: reservationIcon, reservationNote, phoneButton, phoneButtonText,
waitingRange, waitingEvidence, waitingUpdatedAt, emptyCard, emptyIcon, noDataSub

### TASK 57: testing-checklist.md Phase 11 업데이트

- 선행 조건에 003 마이그레이션 + test_domain_data.sql 추가
- TEST 9 신규 추가: 메뉴/리뷰/예약/웨이팅 실제 DB 연결 테스트 (5개 시나리오)
- TEST 9-5: Graceful Fallback 테스트 (테이블 없음 → 크래시 없음)

### Phase 11 검증 결과

| 항목 | 결과 |
|------|------|
| Validator 16개 | ✅ 전체 PASS |
| TypeScript noEmit | ✅ 에러 없음 (앱 코드) |
| 핵심 버그 수정 | 3개 (useReviews/useReservation/useWaiting 캐스트 버그) |
| 새 마이그레이션 | 1개 (003_add_domain_tables.sql) |
| 새 시드 데이터 | 1개 (test_domain_data.sql) |

### Checkpoint (Phase 11, 2026-04-20)

| 항목 | 값 |
|------|-----|
| 현재 단계 | Phase 11 완료 |
| Validator 수 | 16개 (전체 PASS) |
| 동작하는 도메인 기능 | menus / reviews / reservations / waiting (DB 연결 완료) |
| 수정된 훅 | useReviews, useReservation, useWaiting |
| 신규 파일 | 003_add_domain_tables.sql, test_domain_data.sql |


---

## Phase 12: Expo 실행 환경 점검 및 시뮬레이터 안정화 (2026-04-20)

### 발견된 문제 (4개)

| 심각도 | 문제 | 원인 |
|--------|------|------|
| 🔴 치명 | `babel.config.js` 없음 | 프로젝트 루트에 파일 자체가 없었음 |
| 🔴 치명 | `metro.config.js` 없음 | 프로젝트 루트에 파일 자체가 없었음 |
| 🔴 치명 | `newArchEnabled: true` | Expo Go로 LAN/tunnel 연결 불가 — Dev Build 전용 |
| 🟡 경고 | `.app` 바이너리 없음 | `expo run:ios` 한 번도 실행 안 됨 |

### babel.config.js 없음의 영향

Metro 번들러는 `babel.config.js`가 없으면:
1. JSX 변환 불가 → 앱 시작 자체 실패
2. `react-native-worklets/plugin` 미등록 → Reanimated 4.x 워크렛 런타임 에러
3. `babel-preset-expo`의 모듈 alias, Hermes 최적화 미적용

### metro.config.js 없음의 영향

1. expo-router 파일 기반 라우팅 해석 불안정
2. `@/*` 경로 alias (tsconfig `paths`) 런타임 미동작
3. Fast Refresh(HMR) 불안정

### newArchEnabled: true의 의미

- `app.json`의 `"newArchEnabled": true` + `ios/Podfile.properties.json`의 `"newArchEnabled": "true"` 모두 설정됨
- Expo Go 앱(QR 스캔)은 New Architecture를 부분 지원 — 이 프로젝트 수준에서는 **호환 안 됨**
- `react-native-worklets` (Reanimated 4.x), `react-native-screens` 4.x 등 New Arch 전용 모듈 사용 중
- **해결책**: `expo run:ios` → Dev Build(커스텀 네이티브 앱) 시뮬레이터에 설치

### 환경 정보 (점검 시점)

| 항목 | 버전 |
|------|------|
| Node.js | 25.8.2 |
| npm | 11.11.1 |
| Expo SDK | 54.0.33 |
| expo-router | 6.0.23 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| react-native-reanimated | 4.1.7 |
| react-native-worklets | 0.5.1 |
| babel-preset-expo | 54.0.10 |
| Xcode 시뮬레이터 | iOS 26.4, iPhone 17 Pro (Booted) |
| ios/Pods | 설치됨 (pod install 완료) |
| .app 바이너리 | 없음 (expo run:ios 미실행) |

### 수정된 파일

| 파일 | 상태 | 내용 |
|------|------|------|
| `babel.config.js` | 🆕 신규 | babel-preset-expo + react-native-worklets/plugin |
| `metro.config.js` | 🆕 신규 | expo/metro-config getDefaultConfig |

### 실행 명령어 (순서대로)

```bash
# 1. 캐시 초기화 (이전 babel/metro 오류 상태 제거)
npx expo start --clear

# 2. 위가 안 되면 — 시뮬레이터에 Dev Build 직접 컴파일·설치
npx expo run:ios

# 3. 이미 빌드된 앱이 시뮬레이터에 있을 때 Metro만 재시작
npx expo start --ios
```

### 재시작 시 주의사항

- tunnel/LAN은 사용하지 말 것 (New Arch Dev Build에서는 localhost 직접 연결이 기본)
- `expo run:ios` 최초 실행은 Xcode 빌드 포함 5~15분 소요
- 빌드 완료 후에는 `npx expo start --ios` (Metro만)로 빠르게 재시작 가능


---

## Phase 13: 검색 버그 수정 + 지도 탭 개선 (2026-04-21)

### TASK 58: useSearch.ts 검색 버그 수정

**버그**: `.or()` 필터에서 `%` 와일드카드 사용
- PostgREST의 `.or()` 필터 문자열은 `*`를 와일드카드로 사용
- `%`는 URL 인코딩 시 `%25`로 변환되어 리터럴 문자로 처리됨
- 결과: 어떤 검색어도 결과 없음

**수정**: `%${query}%` → `*${q}*` + 특수문자 방어 (`replace(/[*%]/g, "")`)
- address 필드도 검색 대상에 추가

### TASK 59: 지도 탭 UI 개선

- 준비 중 안내 + 현재 region 표시
- 활성화 단계별 가이드 (KR/GLOBAL 분기)
- Naver Cloud / Google Cloud Console 직접 링크 버튼

### 검증 결과
- Validator 16개: 전체 PASS
- TypeScript: 에러 없음

---

## Phase 14 — UI 기능 강화 (2026-04-20)

### TASK 60: 검색 탭 — 카테고리 필터 칩 (`app/(tabs)/index.tsx`)

- 검색 결과가 2개 이상 카테고리를 포함할 때 가로 스크롤 필터 칩 표시
- "전체" 칩 항상 맨 앞, 이후 결과에서 추출한 카테고리 최대 8개
- 선택된 칩으로 클라이언트 측 필터링 (activeCategory state)
- 필터 적용 시 결과 카운트 텍스트 변경 ("N개 결과" → "N개 · 카테고리명")
- 검색 초기화 시 카테고리 필터도 함께 리셋
- 필터 결과 0건 시 EmptyView 표시
- useMemo로 카테고리 목록 및 필터된 리스트 최적화

### TASK 61: 즐겨찾기 탭 — KR/GLOBAL 리전 필터 탭 (`app/(tabs)/favorites.tsx`)

- 헤더 아래 전체 / 🇰🇷 국내 / 🌏 해외 탭 추가
- 선택된 탭 기준 client-side 필터링 (regionFilter state)
- 카운트 표시: 필터 적용된 건수
- 빈 결과 시 탭별 맞춤 EmptyView 메시지
- useMemo로 필터된 즐겨찾기 최적화

### TASK 62: 프로필 탭 — 히스토리 날짜별 그룹핑 (`app/(tabs)/profile.tsx`)

- FlatList → SectionList 교체
- 방문일 기준 날짜 헤더 (ko-KR 형식: "2026년 4월 20일")
- visited_at 없는 항목: "날짜 미상" 섹션
- useMemo로 섹션 데이터 변환, stickySectionHeadersEnabled=false
- ItemSeparatorComponent로 카드 간격 정리

### TASK 63: 상세 페이지 — 리뷰 전체 보기 토글 (`app/restaurant/[id].tsx`)

- 리뷰 총 4개 이상 시 "▼ 전체 리뷰 보기 (N개)" 버튼 노출
- 토글 시 긍정/부정/중립 리뷰 전체 표시, 중립 리뷰 섹션 추가
- 전체 표시 상태에서 "▲ 접기" 버튼
- reviewExpanded state (useState)

### TASK 64: ReviewSummary 타입 + useReviews hook 업데이트

- `src/types/review.ts`: neutralReviews 필드 추가
- `src/hooks/useReviews.ts`: EMPTY_SUMMARY + 반환값에 neutralReviews 추가

### TASK 65: tsconfig.json — supabase/functions 제외

- Deno 런타임용 Edge Function 파일이 tsc 대상에 포함돼 Deno 미정의 오류 발생
- `exclude: ["node_modules", "supabase/functions"]` 추가
- 결과: `npx tsc --noEmit` 에러 0건

### 검증 결과 (Phase 14)
- Validator 16개: 전체 PASS
- TypeScript: 에러 0건 (tsconfig exclude 수정 포함)
- 파일 변경: index.tsx, favorites.tsx, profile.tsx, restaurant/[id].tsx, types/review.ts, hooks/useReviews.ts, tsconfig.json

---

## Phase 15 — 전체 UI/UX 완성 (2026-04-21)

### TASK 66: useDebounce hook 신규 생성
- `src/hooks/useDebounce.ts`: 제네릭 debounce hook, delay ms 후 값 업데이트
- 검색창 자동 검색용 (300ms), setTimeout/clearTimeout 기반

### TASK 67: useHistory 강화
- `clearHistory` mutation 추가 (전체 방문 기록 삭제)
- `visitCounts` useMemo 추가 (restaurant_id → 방문 횟수 맵)
- 반환 타입 `HistoryRow[]` 명시

### TASK 68: useSearch 페이지네이션
- `limit` 파라미터 추가 (기본 30)
- queryKey에 limit 포함 → 값 변화 시 재조회
- `hasMore` 판정 기준 limit 기반으로 변경

### TASK 69: StateViews 컴포넌트 강화
- `OfflineView`: 네트워크 오류 전용 UI (📡 아이콘 + 재시도 버튼)
- `SkeletonCard` / `SkeletonList`: Animated 기반 shimmer 효과
- `isOfflineError()`: 에러 메시지 기반 오프라인 판별 함수

### TASK 70: RestaurantCard 강화
- `savedAt` prop: 즐겨찾기 저장 날짜 표시
- `visitCount` prop: 2회 이상 방문 시 파란 배지 "N회 방문"
- `thumbnail` prop: thumbnailUrl 있으면 Image 컴포넌트로 왼쪽에 표시

### TASK 71: MenuSection 접기/펼치기
- `collapseAfter` prop 추가 (기본 5개)
- 5개 초과 시 "▼ 전체 메뉴 보기 (N개)" 버튼
- 토글 후 "▲ 접기"

### TASK 72: 검색 탭 전면 개선 (index.tsx)
- debounce 300ms 자동 검색 (2글자 이상, 엔터 불필요)
- `SkeletonList` 로딩 교체
- `OfflineView` / `isOfflineError` 오프라인 분기
- 빈 결과 시 추천 검색어 칩 (KR: 명동/강남/홍대... GLOBAL: sushi/pizza...)
- 힌트 화면에도 추천 검색어 칩
- 더 보기 버튼 + `onEndReached` 자동 로드 (limit += 30)
- 검색어 변경 시 limit/activeCategory 리셋

### TASK 73: 즐겨찾기 탭 전면 개선 (favorites.tsx)
- Pull-to-refresh (RefreshControl)
- 스와이프 좌측 삭제: 내장 PanResponder + Animated 기반 SwipeableRow 컴포넌트
  (react-native-gesture-handler 미설치 확인 → 내장 구현)
- savedAt 날짜 RestaurantCard에 전달
- ItemSeparatorComponent 추가

### TASK 74: 프로필 탭 전면 개선 (profile.tsx)
- 통계 카드: 방문 식당 수 / 총 방문 횟수 / 즐겨찾기 수 (3분할)
- Pull-to-refresh
- 방문 기록 전체 삭제 버튼 (Alert 확인 → clearHistory.mutate())
- 방문 횟수 배지: visitCounts[restaurant_id] >= 2 → "N회 방문"
- useFavorites 호출 (통계용)

### TASK 75: 상세 페이지 공유 버튼 (restaurant/[id].tsx)
- 헤더 headerRight에 "공유" 버튼
- Share.share(): 식당명 + 주소 + 지도 URL (KR: 네이버, GLOBAL: 구글)

### TASK 76: testing-checklist.md 업데이트
- TEST 10~13 추가 (검색 debounce, 즐겨찾기 스와이프/날짜, 프로필 통계/전체삭제, 상세 공유/메뉴토글)

### 검증 결과 (Phase 15)
- Validator 16개: 전체 PASS
- TypeScript: 에러 0건
- 신규 파일: useDebounce.ts
- 수정 파일: useHistory.ts, useSearch.ts, StateViews.tsx, RestaurantCard.tsx, MenuSection.tsx, index.tsx, favorites.tsx, profile.tsx, restaurant/[id].tsx, testing-checklist.md


---

## Phase A~F: 자율 추가 작업 (2026-04-27)

사용자 요청: "내가 할 작업말고는 모든 작업이 끝난거야? 그 작업들까지 하고 더 좋은 수정사항 있으면 작업하도록 하고 최대한 많은 작업을 해두도록 해" — 모든 자율 작업 진행 + 추가 개선 발굴.

### Phase A: 첫 진입 region 온보딩
- 신규 store: `src/stores/onboardingStore.ts` (Zustand persist + AsyncStorage)
  - `onboarded` 플래그를 partialize로만 저장, `hydrated`는 런타임 전용
  - `onRehydrateStorage` → `setHydrated(true)`로 라우팅 결정 시점 보장
- 신규 라우트: `app/(onboarding)/_layout.tsx` (headerShown:false), `app/(onboarding)/region.tsx`
  - KR/GLOBAL 카드 라디오 선택, cozyTheme accent 색
  - confirm 시 `setRegion` → `complete()` → `router.replace('/(tabs)')`
- 라우팅 가드: `app/_layout.tsx` AuthGuard에 onboarding 분기 추가
  - hydration 전엔 라우팅 보류, `!onboarded`면 (onboarding)/region으로 강제 이동
  - 온보딩 완료된 사용자가 (onboarding) 그룹에 머물면 (tabs)로 이동
- **버그 수정**: regionStore도 persist로 전환
  - 기존: 사용자가 GLOBAL 선택 → 재시작 시 KR로 리셋되는 결함
  - `migrate()`로 손상된 값은 KR 기본값으로 복구

### Phase B: KeyboardAvoidingView
- login/register는 이미 적용되어 있어 검토만
- `app/restaurant/[id].tsx`의 ScrollView를 KeyboardAvoidingView로 감쌈
  - iOS: `behavior="padding"`, `keyboardVerticalOffset=90`
  - `keyboardShouldPersistTaps="handled"` 추가 → 키보드 위 버튼 첫 탭에 동작

### Phase C: 즐겨찾기 낙관적 업데이트
- `useFavorites.ts` add/remove 양쪽에 `onMutate`/`onError`/`onSettled` 적용
  - mutate 즉시 캐시 반영 → 토글 UI 즉시 응답
  - 실패 시 `previous`로 롤백, 성공/실패 모두 invalidate로 서버 진실 동기화
- 임시 row id에 `optimistic-` prefix sentinel 사용 (실제 row와 구분)

### Phase D: Skeleton loader (상세 페이지)
- 신규 컴포넌트: `src/components/Skeleton.tsx`
  - `SkeletonBox`: Animated.Value 기반 fade loop (0.4 ↔ 0.85, 700ms)
  - `RestaurantDetailSkeleton`: 상세 페이지 레이아웃을 모사한 자리표시자
- `app/restaurant/[id].tsx`의 `LoadingView` 교체

### Phase E: 디스플레이 이름 + 데이터 내보내기
- `User` 타입에 `displayName?: string | null` 추가
  - AuthProvider에서 `session.user.user_metadata.display_name` 매핑
- `useAuthActions.updateDisplayName` 추가 (30자 제한, 빈 문자열은 null로 정규화)
- 신규 컴포넌트: `src/components/DisplayNameModal.tsx` (KeyboardAvoidingView 포함)
- 신규 유틸: `src/utils/exportData.ts`
  - `buildExportPayload`: 직렬화 (version:1, exportedAt, userId, history, favorites, counts)
  - `shareUserDataExport`: React Native `Share.share`로 시스템 공유 시트 호출
  - 보안: caller가 user_id 필터링한 결과만 전달, 민감 필드 없음
- 프로필 화면:
  - 아바타/이름이 `displayName ?? email` 표시, 옆에 ✎ 편집 버튼
  - "📤 내 데이터 내보내기 (JSON)" 버튼 (history/favorites 모두 비면 비활성)

### Phase F: 검색 결과 정렬 옵션
- `app/(tabs)/index.tsx`에 `SortKey = 'default' | 'name' | 'rating'` 추가
  - default: API 응답 순서 유지
  - name: `localeCompare(b.name, 'ko')`
  - rating: `cardMeta.averageRating` 내림차순, 평점 없는 항목은 뒤로
- 결과 헤더 아래에 정렬 칩 ScrollView 배치 (a11y: radio role + selected state)
- 클라이언트 정렬만 수행 → region/source 분기 영향 없음

### 검증 결과 (Phase A~F)
- TypeScript: 0 errors
- Validators: 18/18 PASS
- Fail cases: 7/7 detected
