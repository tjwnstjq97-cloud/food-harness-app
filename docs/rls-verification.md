# RLS (Row Level Security) 검증 가이드

> Supabase PostgreSQL에서 favorites, history 테이블의 소유권 분리 구조를 설명한다.

## 핵심 원칙

**auth.uid() = user_id** 규칙으로 DB 레벨에서 소유권을 강제한다.
- 사용자 A는 사용자 B의 즐겨찾기/방문 기록을 절대 조회/수정/삭제할 수 없다.
- 이 규칙은 클라이언트 코드가 아닌 **PostgreSQL 정책**으로 강제된다.

---

## favorites 테이블 RLS 정책

```sql
-- 조회: 본인 데이터만
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

-- 추가: 본인 데이터만
CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 삭제: 본인 데이터만
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);
```

### 추가 보호: UNIQUE 제약
```sql
UNIQUE(user_id, restaurant_id)
```
- 같은 사용자가 같은 식당을 중복 저장 불가
- DB 레벨 + 클라이언트(useFavorites.isFavorite 체크) 이중 방어

---

## history 테이블 RLS 정책

```sql
-- 조회: 본인 데이터만
CREATE POLICY "Users can view own history"
  ON public.history FOR SELECT
  USING (auth.uid() = user_id);

-- 추가: 본인 데이터만
CREATE POLICY "Users can insert own history"
  ON public.history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 삭제: 본인 데이터만
CREATE POLICY "Users can delete own history"
  ON public.history FOR DELETE
  USING (auth.uid() = user_id);
```

### 중복 기록 정책
- history는 UNIQUE 제약 **없음** (같은 식당 여러 번 방문 기록 가능)
- 한 번 기록된 방문 기록은 삭제하지 않음 (이력 보존 원칙)
- 방문 시각은 `visited_at` 필드로 기록됨

---

## 하네스 validator와의 이중 방어

| 레이어 | 검증 방법 |
|--------|----------|
| DB (PostgreSQL RLS) | `auth.uid() = user_id` 정책 강제 |
| 하네스 validator | `user_ownership.py` — user_id 필드 존재 확인 |
| 클라이언트 코드 | `useFavorites.isFavorite()` 사전 체크 |

---

## 테스트 시나리오

### 시나리오 1: 본인 데이터만 조회되는지 확인
1. 사용자 A로 로그인 → 즐겨찾기 추가
2. 사용자 B로 로그인 → 즐겨찾기 목록 확인
3. **기대값**: 사용자 B의 즐겨찾기에 사용자 A의 데이터 없음

### 시나리오 2: 비로그인 상태에서 접근 불가
1. 로그아웃 후 favorites API 직접 호출 시도
2. **기대값**: PostgreSQL RLS 오류 (401 또는 빈 배열)

### 시나리오 3: 타인 데이터 삭제 시도
1. 사용자 A의 즐겨찾기 ID를 알고 있는 사용자 B가 삭제 시도
2. **기대값**: RLS 정책으로 차단 (0 rows affected)

### 시나리오 4: 중복 즐겨찾기 방지
1. 같은 식당을 두 번 즐겨찾기 시도
2. **기대값**: 두 번째 시도는 `23505` (UNIQUE 위반) → 클라이언트에서 무시

---

## Supabase 대시보드에서 확인하는 방법

1. Supabase 대시보드 → Table Editor
2. favorites 테이블 선택
3. "RLS enabled" 확인 (초록 표시)
4. Auth → Policies에서 4개 정책 확인
