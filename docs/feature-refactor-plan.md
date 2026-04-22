# Feature 구조 리팩토링 계획

> 현재 `src/` 플랫 구조를 `src/features/` 기반으로 전환하는 로드맵.
> 파일이 30개 이상이 되면 실행. 현재는 계획만 수립.

## 목표 구조

```
src/
├─ shared/                      # 전역 공유 레이어
│  ├─ components/               # RestaurantCard, StateViews, SearchBar, RegionBadge
│  ├─ types/                    # region.ts, auth.ts (공통 타입)
│  ├─ utils/                    # constants.ts, validators.ts, mapLink.ts, crudLogger.ts
│  └─ lib/                      # supabase.ts
│
├─ features/
│  ├─ auth/
│  │  ├─ hooks/useAuth.ts
│  │  ├─ stores/authStore.ts
│  │  └─ types/auth.ts
│  │
│  ├─ restaurant/               # 핵심 도메인
│  │  ├─ hooks/useSearch.ts
│  │  ├─ stores/selectedRestaurantStore.ts
│  │  └─ types/restaurant.ts, review.ts, reservation.ts, waiting.ts, menu.ts
│  │
│  ├─ favorites/
│  │  ├─ hooks/useFavorites.ts
│  │  └─ types/ (FavoriteRow)
│  │
│  ├─ history/
│  │  ├─ hooks/useHistory.ts
│  │  └─ types/ (HistoryRow)
│  │
│  └─ map/
│     ├─ hooks/useMap.ts
│     └─ utils/mapLink.ts
│
└─ providers/                   # 그대로 유지 (AuthProvider, QueryProvider, RegionProvider)
```

## 이동 위험도 분류

### ✅ LOW RISK (즉시 이동 가능)
- `src/utils/crudLogger.ts` → `src/shared/utils/`
- `src/types/region.ts` → `src/shared/types/`
- `src/utils/constants.ts` → `src/shared/utils/`

### ⚠️ MEDIUM RISK (import 경로 수정 필요)
- `src/components/*.tsx` → `src/shared/components/`
- `src/utils/validators.ts` → `src/shared/utils/`
- `src/hooks/useAuth.ts` → `src/features/auth/hooks/`

### 🚨 HIGH RISK (화면 코드와 강하게 결합)
- `src/hooks/useSearch.ts` (index.tsx에서 직접 사용)
- `src/hooks/useFavorites.ts` (favorites.tsx, restaurant/[id].tsx에서 사용)
- `src/stores/selectedRestaurantStore.ts` (index.tsx, restaurant/[id].tsx)
- `src/providers/*.tsx` (app/_layout.tsx에서 감쌈)

## 실행 조건

1. 파일 수 30개 이상 도달 (현재 ~25개)
2. 모든 validator PASS 상태 유지
3. 앱 빌드 오류 없음 확인
4. 한 번에 한 feature씩만 이동

## 현재 결정: 이동 보류

- 현재 src/ 구조가 약 25개 파일로 관리 가능한 수준
- 상세 페이지, favorites, history 기능이 안정화된 후 이동 권장
- 이동 시 `src/shared/` 먼저 만들고 공통 파일부터 이동
