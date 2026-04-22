검색 화면(app/(tabs)/index.tsx)을 개선한다.

먼저 아래 파일들을 읽어라:
- `/CLAUDE.md`
- `/docs/architecture.md`
- `/app/(tabs)/index.tsx`
- `/src/hooks/useSearch.ts`
- `/src/stores/searchHistoryStore.ts`
- `/src/components/SearchBar.tsx`

## 현재 상태 파악

현재 구현된 것:
- SearchBar 컴포넌트 + 엔터 제출
- useSearch hook (DB 기반, category/name ilike 검색)
- 최근 검색어 칩 (searchHistoryStore, AsyncStorage persist)
- 검색 결과 카드 (카테고리 배지, 주소, 탭하여 상세보기)
- Loading / Error / Empty 상태 처리

## 개선 작업 (우선순위 순)

### P1: 실시간 검색어 제안 (debounce)
- 입력 중 300ms debounce 후 DB 검색 (isLoading 중 스피너)
- SearchBar onChangeText → debounced query 처리
- 단, 제출(엔터) 시는 즉시 실행

### P2: 카테고리 필터 칩
- 검색 결과 상단에 카테고리 칩 행 추가
- "전체" + 결과에 있는 카테고리 목록 동적 생성
- 탭하면 해당 카테고리만 필터링 (클라이언트 필터)

### P3: 결과 없음 개선
- 현재 "검색 결과가 없습니다" → 검색어 + "관련 카테고리 시도" 안내 추가
- 최근 검색어가 있으면 "이전에 검색한 관련 키워드" 표시

## Acceptance Criteria

```bash
# 하네스 검증 (필수)
python3 harness/validators/run_all.py
# → 16개 모두 PASS

# TypeScript 타입 확인
npx tsc --noEmit 2>&1 | head -20
```

## 금지사항

- console.log 사용 금지 (console.info만 허용)
- API Key 하드코딩 금지
- region 분기 없이 검색 로직 수정 금지
- app/ 외의 src/ 훅/컴포넌트 구조 변경 금지 (인터페이스만 사용)
- 기존 searchHistoryStore 인터페이스 변경 금지

## 완료 후

1. `python3 harness/validators/run_all.py` 실행 — 16개 PASS 확인
2. research.md 업데이트 (완료 항목 기록)
