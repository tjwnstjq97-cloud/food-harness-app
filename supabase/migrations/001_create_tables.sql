-- ================================================
-- 001_create_tables.sql
-- 아직 실행하지 않음. Supabase 대시보드 SQL Editor에서 실행 예정.
-- ================================================

-- ========================================
-- favorites 테이블
-- 사용자별 즐겨찾기. user_id 소유권 분리 필수.
-- ========================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_region TEXT NOT NULL CHECK (restaurant_region IN ('KR', 'GLOBAL')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- 같은 사용자가 같은 식당을 중복 즐겨찾기 방지
  UNIQUE(user_id, restaurant_id)
);

-- 인덱스
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);

-- RLS 활성화
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 본인만 추가
CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인만 삭제
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);


-- ========================================
-- history 테이블
-- 사용자별 방문 기록. user_id 소유권 분리 필수.
-- ========================================
CREATE TABLE IF NOT EXISTS public.history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_region TEXT NOT NULL CHECK (restaurant_region IN ('KR', 'GLOBAL')),
  visited_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX idx_history_user_id ON public.history(user_id);
CREATE INDEX idx_history_visited_at ON public.history(visited_at DESC);

-- RLS 활성화
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회
CREATE POLICY "Users can view own history"
  ON public.history FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 본인만 추가
CREATE POLICY "Users can insert own history"
  ON public.history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인만 삭제
CREATE POLICY "Users can delete own history"
  ON public.history FOR DELETE
  USING (auth.uid() = user_id);
