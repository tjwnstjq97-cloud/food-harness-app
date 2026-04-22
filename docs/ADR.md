# Architecture Decision Records

> 최종 업데이트: 2026-04-18 (Phase 10 기준)

## 철학
하네스 엔지니어링 우선. 구조와 검증이 기능 구현보다 먼저다.
잘못된 결과는 절대 완료로 간주하지 않는다.

---

### ADR-001: React Native (Expo) + TypeScript
**결정**: 모바일 앱 프레임워크로 Expo (React Native) + TypeScript strict mode 선택  
**이유**: 크로스플랫폼(iOS/Android) 단일 코드베이스. Expo prebuild로 네이티브 SDK(네이버 지도) 연동 가능.  
**트레이드오프**: Expo prebuild 필요 → CI/CD 복잡도 증가. 네이티브 기능은 dev build 필요.

---

### ADR-002: Supabase (PostgreSQL + Auth + Edge Functions)
**결정**: 백엔드/DB로 Supabase 선택  
**이유**: PostgreSQL + 인증 + Edge Functions + RLS(Row Level Security)를 단일 서비스로. 초기 개발 속도 최우선.  
**트레이드오프**: Supabase 의존성. Edge Function cold start 있음. 대용량 트래픽 시 비용 증가.

---

### ADR-003: Zustand v5 (클라이언트) + TanStack Query v5 (서버)
**결정**: 상태관리를 클라이언트/서버 레이어로 분리  
**이유**: Zustand — 경량 전역 상태(auth, region, selectedRestaurant, searchHistory). TanStack Query — 서버 상태 캐싱/무효화/재시도.  
**트레이드오프**: 두 라이브러리 학습 비용. Zustand v5 curried syntax(`create<T>()((set) => ...)`) 주의 필요.

---

### ADR-004: Region 분기 (KR / GLOBAL) 강제
**결정**: 모든 외부 연동(검색/지도/리뷰)에서 KR/GLOBAL 분기 필수  
**이유**: 국내 서비스(네이버 지도/API)와 해외 서비스(Google Maps/Places)가 완전히 다른 SDK/API를 사용. 하네스 validator(region_logic)가 이를 강제.  
**트레이드오프**: 분기 코드 증가. Region 없는 restaurant 저장 시 자동 차단.

---

### ADR-005: 역정규화 (favorites/history에 restaurant_name + restaurant_region 저장)
**결정**: favorites/history 테이블에 restaurant_id 뿐 아니라 restaurant_name, restaurant_region도 저장  
**이유**: 즐겨찾기/히스토리 탭에서 상세 페이지 이동 시 전체 데이터가 없어도 최소한의 정보로 이동 가능. DB 조회 1회 절감.  
**트레이드오프**: 데이터 중복. restaurant 이름 변경 시 동기화 필요 (현재는 미구현).

---

### ADR-006: Graceful Fallback (PostgreSQL 42P01)
**결정**: 모든 도메인 훅(useReviews, useMenus, useReservation, useWaiting)에서 42P01(테이블 미존재) 에러를 무시하고 빈 결과 반환  
**이유**: DB 테이블이 아직 생성되지 않은 상태에서도 앱이 크래시 없이 동작해야 함.  
**트레이드오프**: 실제 DB 에러와 테이블 미존재 에러를 구분하지 않으면 버그 은폐 위험. PGRST301도 함께 처리.

---

### ADR-007: Python Validator 하네스 (16개)
**결정**: 앱 도메인 규칙을 Python validator로 강제  
**이유**: TypeScript 컴파일러가 잡지 못하는 비즈니스 규칙(리뷰 출처 필수, region 분기 강제, 민감정보 로깅 금지 등)을 자동화된 검증으로 강제.  
**트레이드오프**: validator 유지보수 비용. 앱 코드 변경 시 validator도 함께 업데이트 필요.

---

### ADR-008: API Key는 Edge Function에서만
**결정**: 네이버/구글 API Key는 Supabase Edge Function 환경변수에만 저장, 클라이언트 노출 금지  
**이유**: 보안. `hardcoded_key` validator가 소스코드 스캔으로 강제.  
**트레이드오프**: Edge Function 배포 필요. 개발 단계에서 실제 검색 동작 확인 어려움(DB 직접 조회로 대체).

---

### ADR-009: 하네스 run.py (EXPERIMENTAL)
**결정**: `claude -p` subprocess 호출 기반 자동화 실행기 채택  
**이유**: research.md + failed_tasks.md 컨텍스트를 자동 주입해 세션 간 상태 유지. 재시도/blocked 상태/progress_indicator 지원.  
**트레이드오프**: claude CLI 설치 + ANTHROPIC_API_KEY 필요. EXPERIMENTAL 상태. --dangerously-skip-permissions 사용 시 주의.
