음식점 상세 페이지(app/restaurant/[id].tsx)를 개선한다.

먼저 아래 파일들을 읽어라:
- `/CLAUDE.md`
- `/docs/architecture.md`
- `/app/restaurant/[id].tsx`
- `/src/hooks/useReviews.ts`
- `/src/hooks/useMenus.ts`
- `/src/hooks/useReservation.ts`
- `/src/hooks/useWaiting.ts`
- `/src/components/ReviewCard.tsx`
- `/src/components/MenuSection.tsx`
- `/src/types/review.ts`

## 현재 상태 파악

현재 구현된 것:
- 헤더 카드 (이름, 카테고리, 주소, 전화, region 배지, 즐겨찾기 토글)
- 지도 버튼 (KR→네이버, GLOBAL→구글)
- MenuSection (대표 메뉴 최대 3개, 42P01 graceful fallback)
- 예약 정보 섹션 (statusLabel, hasLink, walkInAvailable)
- 웨이팅 섹션 (displayText, isEstimated)
- 리뷰 요약 (평점, 긍정/부정/중립 수) + ReviewCard (긍정 2개, 부정 1개)
- 방문 기록 자동 저장 (마운트 시 addVisit)

## 개선 작업 (우선순위 순)

### P1: 리뷰 하이라이트 키워드 표시
- ReviewSummary.highlights (ReviewHighlight[]) 가 있으면 키워드 칩 형태로 표시
- 하이라이트 없으면 섹션 숨김 (하네스 규칙: source 없는 데이터 표시 금지)
- 긍정(초록) / 부정(빨강) / 중립(회색) 색상 구분

### P2: 전체 리뷰 더보기
- 현재 긍정 2개 + 부정 1개만 표시 → "리뷰 더보기" 버튼 추가
- 탭하면 positiveReviews + negativeReviews 전체 펼침 (토글)
- neutralReviews도 펼침 시 추가 표시

### P3: 공유 버튼
- 헤더 우상단에 공유 아이콘 추가
- `Share.share({ message: "${name} - ${address}" })` (React Native Share API)
- region에 따라 지도 링크 포함

## Acceptance Criteria

```bash
python3 harness/validators/run_all.py
# → 16개 모두 PASS

npx tsc --noEmit 2>&1 | head -20
```

## 금지사항

- source 없는 리뷰 / 하이라이트 표시 금지 (하네스 규칙)
- console.log 금지 (console.info 허용)
- useSignatureMenus / useReviews 등 기존 훅 인터페이스 변경 금지
- region 없는 지도 링크 생성 금지
- app/ 외 src/ 구조 변경 금지

## 완료 후

1. `python3 harness/validators/run_all.py` 실행 — 16개 PASS 확인
2. docs/testing-checklist.md 해당 항목 체크
3. research.md 업데이트
