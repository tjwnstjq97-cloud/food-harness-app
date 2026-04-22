방문 기록 탭(app/(tabs)/profile.tsx)을 개선한다.

먼저 아래 파일들을 읽어라:
- `/CLAUDE.md`
- `/app/(tabs)/profile.tsx`
- `/src/hooks/useHistory.ts`
- `/src/types/restaurant.ts`

## 현재 상태 파악

현재 구현된 것:
- useHistory로 방문 기록 목록 조회
- 카드 탭 → selectedRestaurantStore → /restaurant/[id] 이동
- 방문 기록 자동 저장 (상세 페이지 마운트 시 addVisit)
- 빈 목록 시 EmptyView + "상세 페이지 진입 시 자동 저장" 안내

## 개선 작업 (우선순위 순)

### P1: 날짜별 그룹핑
- 방문 기록을 날짜별로 섹션 분리 (오늘, 어제, 이번 주, 이전)
- SectionList 또는 FlatList + 섹션 헤더 방식
- visited_at 기준 (ISO 8601 → 로컬 날짜 비교)

### P2: 중복 방문 표시
- 같은 음식점을 여러 번 방문한 경우 카드에 "3회 방문" 뱃지 표시
- HistoryRow 목록에서 restaurant_id 기준 count 집계 (클라이언트 처리)
- 중복 카드는 최신 1개만 표시 (나머지는 카운트로 요약)

### P3: 기록 전체 삭제
- 상단 "전체 삭제" 버튼 → Alert 확인 후 useHistory의 clearAll 호출
- clearAll이 없으면 hook에 추가: Supabase DELETE WHERE user_id = auth.uid()

## Acceptance Criteria

```bash
python3 harness/validators/run_all.py
# → 16개 모두 PASS

# restaurant_region 필드 필수 여부 확인
python3 -c "
from harness.validators.data.restaurant_region_required import validate
result = validate({'history': [{'restaurant': 'test', 'user_id': 'u1'}]})
print('FAIL expected:', not result['valid'])
"
```

## 금지사항

- user_id 없이 history 조회 로직 추가 금지 (RLS 위반)
- restaurant_region 없이 history 저장 금지
- console.log 금지
- 승인 없이 새 패키지 설치 금지 (SectionList는 React Native 내장)

## 완료 후

1. `python3 harness/validators/run_all.py` 실행 — 16개 PASS 확인
2. research.md 업데이트
