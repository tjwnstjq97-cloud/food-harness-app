-- ================================================
-- 002_add_profiles_and_restaurants.sql
-- 아직 실행하지 않음. Supabase 대시보드 SQL Editor에서 실행 예정.
-- 001_create_tables.sql 이후에 실행할 것.
-- ================================================

-- ========================================
-- profiles 테이블
-- 사용자 프로필 확장 정보. auth.users와 1:1 관계.
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  preferred_region TEXT NOT NULL DEFAULT 'KR' CHECK (preferred_region IN ('KR', 'GLOBAL')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: 본인 프로필만 조회
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS: 본인 프로필만 수정
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS: 회원가입 시 자동 생성
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 트리거: 회원가입 시 자동으로 profiles 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, preferred_region)
  VALUES (NEW.id, 'KR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- restaurants 캐시 테이블 (선택 사항)
-- 외부 API에서 가져온 음식점 정보를 캐시.
-- 누구나 읽을 수 있지만, Edge Function만 쓸 수 있음.
-- ========================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY,               -- 외부 API의 restaurant ID
  name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('KR', 'GLOBAL')),
  category TEXT,
  address TEXT,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source TEXT NOT NULL,              -- 'naver', 'google' 등
  raw_data JSONB,                    -- 원본 API 응답 캐시
  fetched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX idx_restaurants_region ON public.restaurants(region);
CREATE INDEX idx_restaurants_name ON public.restaurants USING gin(to_tsvector('simple', name));

-- RLS 활성화
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- RLS: 인증된 사용자는 읽기 가능
CREATE POLICY "Authenticated users can view restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (true);

-- RLS: INSERT/UPDATE/DELETE는 서비스 역할만 (Edge Function에서 service_role 사용)
-- 클라이언트에서는 쓰기 불가
