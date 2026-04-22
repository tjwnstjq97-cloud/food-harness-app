# Architecture

> 최종 업데이트: 2026-04-18 (Phase 10 기준)

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프론트엔드 | React Native (Expo) + TypeScript | prebuild/dev build 전제 |
| 상태관리 | Zustand + TanStack Query | 로컬 상태 + 서버 상태 분리 |
| 백엔드/DB | Supabase (PostgreSQL) | Auth + RLS + Edge Functions |
| 인증 | Supabase Auth | 이메일 로그인 (소셜 로그인 추후) |
| 지도 (KR) | 네이버 지도 네이티브 SDK | Expo prebuild 필요 |
| 지도 (GLOBAL) | Google Maps SDK | 추후 확장 |
| 하네스 | Python validators + Shell hooks | harness/ 디렉토리 |

---

## 디렉토리 구조 (Phase 8 기준)

```
food-harness-app/
├─ app/                         # Expo Router (파일 기반 라우팅)
│  ├─ _layout.tsx               # 루트 레이아웃 + AuthGuard + Stack 선언
│  ├─ (auth)/                   # 로그인, 회원가입 (헤더 없음)
│  │  ├─ _layout.tsx
│  │  ├─ login.tsx
│  │  └─ register.tsx
│  ├─ (tabs)/                   # 메인 탭 4개 (헤더 없음)
│  │  ├─ _layout.tsx
│  │  ├─ index.tsx              # 홈(검색) — SearchBar + 결과 카드 + 상세 이동
│  │  ├─ map.tsx                # 지도 (prebuild 전 placeholder)
│  │  ├─ favorites.tsx          # 즐겨찾기 목록
│  │  └─ profile.tsx            # 프로필 + 방문기록
│  └─ restaurant/
│     └─ [id].tsx               # 음식점 상세 페이지
│
├─ src/
│  ├─ lib/
│  │  └─ supabase.ts            # Supabase 클라이언트 초기화
│  ├─ providers/
│  │  ├─ AuthProvider.tsx       # Supabase Auth 상태 감시
│  │  ├─ QueryProvider.tsx      # TanStack Query 설정
│  │  └─ RegionProvider.tsx     # KR/GLOBAL 전역 상태
│  ├─ stores/
│  │  ├─ authStore.ts           # 인증 상태 (Zustand v5)
│  │  ├─ regionStore.ts         # region 상태 (KR/GLOBAL)
│  │  ├─ selectedRestaurantStore.ts  # 상세 이동용 선택 식당
│  │  └─ searchHistoryStore.ts  # 최근 검색어 (AsyncStorage persist)
│  ├─ types/
│  │  ├─ auth.ts
│  │  ├─ region.ts              # "KR" | "GLOBAL" + isValidRegion
│  │  ├─ restaurant.ts          # Restaurant, SearchRequest, SearchResult, FavoriteRow, HistoryRow
│  │  ├─ review.ts              # Review, ReviewSummary, ReviewHighlight
│  │  ├─ reservation.ts         # Reservation, ReservationStatus, getReservationLabel
│  │  ├─ waiting.ts             # Waiting, WaitingConfidence, formatWaitingLabel
│  │  └─ menu.ts                # MenuItem, PriceStatus
│  ├─ hooks/
│  │  ├─ useAuth.ts             # signIn/signUp/signOut
│  │  ├─ useSearch.ts           # 음식점 검색 (DB 기반, Edge Function TODO)
│  │  ├─ useFavorites.ts        # 즐겨찾기 CRUD + isFavorite + toggleFavorite
│  │  ├─ useHistory.ts          # 방문기록 조회 + addVisit
│  │  ├─ useReviews.ts          # 리뷰 조회 + 출처 필터 + 감정 분리
│  │  ├─ useReservation.ts      # 예약 정보 + status 분기
│  │  ├─ useWaiting.ts          # 웨이팅 + confidence 분기
│  │  ├─ useMenus.ts            # 메뉴 조회 + 대표 메뉴 필터
│  │  ├─ useRestaurantById.ts   # 단일 음식점 DB 조회
│  │  └─ useMap.ts              # 지도 관련 유틸
│  ├─ components/
│  │  ├─ RestaurantCard.tsx     # 음식점 카드 (즐겨찾기/히스토리 공통)
│  │  ├─ StateViews.tsx         # Loading / Error / Empty / NoData
│  │  ├─ SearchBar.tsx          # 검색 바 컴포넌트
│  │  ├─ RegionBadge.tsx        # KR / GLOBAL 배지
│  │  ├─ MenuSection.tsx        # 대표 메뉴 목록 (source 없으면 표시 금지)
│  │  └─ ReviewCard.tsx         # 개별 리뷰 카드 (source 없으면 null)
│  └─ utils/
│     ├─ constants.ts           # NO_INFO, ESTIMATED_LABEL 등
│     ├─ validators.ts          # 클라이언트 검증 (filterValidReviews 등)
│     ├─ mapLink.ts             # 지도 딥링크 (KR→Naver, GLOBAL→Google)
│     └─ crudLogger.ts          # 안전 CRUD 로거 (민감정보 마스킹)
│
├─ harness/
│  ├─ run.py                    # 에이전틱 실행기 (EXPERIMENTAL — claude CLI 연동)
│  ├─ validators/               # 16개 validator (전체 PASS 유지)
│  │  ├─ base/
│  │  ├─ region/
│  │  ├─ review/
│  │  ├─ reservation/
│  │  ├─ waiting/
│  │  ├─ user/
│  │  ├─ security/ (6개)
│  │  ├─ data/ (2개: restaurant_region_required, menu_source_required)
│  │  └─ run_all.py
│  ├─ hooks/
│  └─ scripts/
│
├─ supabase/
│  └─ migrations/
│     ├─ 001_create_tables.sql  # favorites, history + RLS
│     └─ 002_add_profiles_and_restaurants.sql
│
└─ docs/
   ├─ architecture.md           # 이 파일
   ├─ rls-verification.md       # RLS 검증 가이드
   ├─ feature-refactor-plan.md  # Feature 구조 전환 로드맵
   └─ supabase-setup.md         # Supabase 초기 설정 가이드
```

---

## 핵심 데이터 흐름

### 검색 → 상세 흐름

```
사용자 검색어 입력
  → useSearch (TanStack Query)
    → Supabase restaurants 테이블 (임시, Edge Function 전환 예정)
  → SearchResult 카드 목록 표시
  → 카드 탭
    → selectedRestaurantStore.setSelected(restaurant)
    → router.push('/restaurant/${id}')
  → restaurant/[id].tsx 마운트
    → selectedRestaurantStore에서 Restaurant 객체 읽기
    → useHistory.addVisit (History 자동 기록)
    → useReviews, useReservation, useWaiting 병렬 조회
    → 지도 버튼 클릭 → openRestaurantMap (region 분기)
```

### Favorites 흐름

```
상세 페이지 ♡ 버튼 탭
  → useFavorites.toggleFavorite
    → isFavorite() 체크 (클라이언트 사전 체크)
    → 없으면: supabase.insert (UNIQUE 보호)
    → 있으면: supabase.delete
  → invalidateQueries(['favorites', user.id])
  → 즐겨찾기 탭에서 최신 목록 자동 반영
```

### Auth 흐름

```
앱 실행
  → AuthProvider: supabase.auth.onAuthStateChange 감시
  → AuthGuard: useSegments + useRouter + useEffect
    → 비로그인 + 탭 화면 → /auth/login
    → 로그인됨 + 로그인 화면 → /(tabs)
```

---

## Region 분기 원칙

| 항목 | KR | GLOBAL |
|------|-----|--------|
| 검색 | 네이버 API (Edge Function) | 구글 Places API |
| 지도 | 네이버 지도 네이티브 SDK | Google Maps SDK |
| 리뷰 출처 | naver, kakao, mangoplate | google, yelp, tripadvisor |

- `RegionProvider`가 전역 KR/GLOBAL 상태 제공
- `regionStore`가 유효하지 않은 값 차단
- `mapLink.ts`가 region 없는 호출 시 즉시 에러 throw

---

## Validator 목록 (16개, 전체 PASS)

| # | Validator | 카테고리 | 설명 |
|---|-----------|----------|------|
| 1 | required_fields | base | 필수 필드 존재 확인 |
| 2 | no_sensitive_logs | base | 민감 키워드 탐지 |
| 3 | region_logic | region | KR/GLOBAL 분기 강제 |
| 4 | review_source | review | 리뷰 출처 필수 |
| 5 | review_sentiment | review | 긍정/부정 분리 확인 |
| 6 | reservation_check | reservation | 예약 링크 필수 |
| 7 | waiting_evidence | waiting | 웨이팅 근거/추정 표기 |
| 8 | user_ownership | user | user_id 소유권 분리 |
| 9 | api_exposure | security | 클라이언트 외부 API 차단 |
| 10 | hardcoded_key | security | 소스코드 API Key 스캔 |
| 11 | env_access | security | .env 직접 접근 금지 |
| 12 | service_role_key | security | service_role 사용 금지 |
| 13 | pii_in_logs | security | 로그 내 개인정보 감지 |
| 14 | console_debug | security | 디버그 로그 잔존 감지 |
| 15 | restaurant_region_required | data | favorites/history region 필수 |
| 16 | menu_source_required | data | 메뉴 source 필수 + 가격 상태 표기 |

---

## DB 스키마

### 구현된 테이블

| 테이블 | 용도 | RLS | 비고 |
|--------|------|-----|------|
| favorites | 즐겨찾기 | auth.uid() = user_id | UNIQUE(user_id, restaurant_id) |
| history | 방문 기록 | auth.uid() = user_id | 중복 허용 (이력 보존) |
| profiles | 사용자 프로필 | auth.uid() = id | 트리거 자동 생성 |
| restaurants | 음식점 캐시 | 인증 사용자 읽기 | 검색 결과 캐싱 |

### 미구현 테이블 (Edge Function 전환 후 필요)
- reviews
- reservations
- waiting
- menus

---

## 기능 확장 가이드

| 추가할 것 | 위치 | 예시 |
|----------|------|------|
| 새 화면 | `app/(tabs)/` 또는 `app/xxx/[id].tsx` | menu/[id].tsx |
| 새 hook | `src/hooks/useXxx.ts` | useMenu.ts |
| 새 컴포넌트 | `src/components/Xxx.tsx` | MenuCard.tsx |
| 새 validator | `harness/validators/카테고리/이름.py` | data/menu_price_required.py |

## Expo Prebuild 전제사항

- 네이버 지도 SDK: `npx expo prebuild` 필요
- 현재 지도 탭은 placeholder
- EAS Build로 개발 빌드 생성 후 네이티브 SDK 연동 예정
