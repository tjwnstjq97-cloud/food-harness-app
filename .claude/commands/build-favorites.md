즐겨찾기 탭(app/(tabs)/favorites.tsx)을 개선한다.

먼저 아래 파일들을 읽어라:
- `/CLAUDE.md`
- `/app/(tabs)/favorites.tsx`
- `/src/hooks/useFavorites.ts`
- `/src/types/restaurant.ts`

## 현재 상태 파악

현재 구현된 것:
- useFavorites로 즐겨찾기 목록 조회
- 카드 탭 → selectedRestaurantStore 경유 → /restaurant/[id] 이동
- isFavorite(), toggleFavorite() 사용
- UNIQUE(user_id, restaurant_id) 중복 방지 + 23505 에러 silent ignore
- 빈 목록 시 EmptyView

## 개선 작업 (우선순위 순)

### P1: region 필터
- 상단에 "전체 / 🇰🇷 KR / 🌏 GLOBAL" 필터 탭 추가
- restaurant_region 기준 클라이언트 필터링
- 현재 region 탭 상태는 useState로 관리 (persist 불필요)

### P2: 즐겨찾기 삭제 스와이프
- FlatList 항목에 스와이프 액션 추가 (우→좌 스와이프 → "삭제" 빨간 버튼)
- `react-native-gesture-handler`가 이미 설치돼 있으면 사용, 없으면 롱프레스+확인 Alert 방식
- 삭제 시 useFavorites.removeFavorite 호출

### P3: 추가된 날짜 표시
- 카드 하단에 "2026-04-18 저장" 형식으로 created_at 표시
- FavoriteRow 타입에 created_at 필드 있으면 사용, 없으면 숨김

## Acceptance Criteria

```bash
python3 harness/validators/run_all.py
# → 16개 모두 PASS

# restaurant_region 필드 필수 여부 확인
python3 -c "
from harness.validators.data.restaurant_region_required import validate
result = validate({'favorites': [{'restaurant': 'test', 'user_id': 'u1'}]})
print('FAIL expected:', not result['valid'])
"
```

## 금지사항

- restaurant_region 없이 favorites 저장 로직 추가 금지
- user_id 없이 favorites 조회 금지 (RLS 위반)
- console.log 금지
- 승인 없이 새 패키지 설치 금지

## 완료 후

1. `python3 harness/validators/run_all.py` 실행 — 16개 PASS 확인
2. research.md 업데이트
