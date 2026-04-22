-- ================================================
-- 003_add_domain_tables.sql
-- 도메인 테이블: menus / reviews / reservations / waiting
--
-- 실행 방법: Supabase 대시보드 > SQL Editor > 이 파일 붙여넣기 > Run
-- 전제조건: 001, 002 마이그레이션 실행 완료
-- ================================================

-- ========================================
-- menus 테이블
-- 음식점별 메뉴 목록. source 필수 (하네스 규칙).
-- ========================================
CREATE TABLE IF NOT EXISTS public.menus (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id  TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  price          INTEGER NOT NULL DEFAULT 0,          -- 0 = 가격 정보 없음
  price_status   TEXT NOT NULL DEFAULT 'unknown'
                   CHECK (price_status IN ('confirmed', 'estimated', 'unknown')),
  is_signature   BOOLEAN NOT NULL DEFAULT false,
  source         TEXT NOT NULL,                       -- 필수 (하네스 규칙: 출처 없는 메뉴 표시 금지)
  mention_count  INTEGER DEFAULT 0,
  image_url      TEXT,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON public.menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_signature  ON public.menus(is_signature DESC);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 읽기 가능
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'menus' AND policyname = 'Authenticated users can view menus'
  ) THEN
    CREATE POLICY "Authenticated users can view menus"
      ON public.menus FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- INSERT/UPDATE/DELETE는 서비스 역할만 (Edge Function)
-- 클라이언트에서 직접 쓰기 불가


-- ========================================
-- reviews 테이블
-- 음식점 리뷰. source 필수 (하네스 규칙: 출처 없는 리뷰 표시 금지).
-- ========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id  TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  text           TEXT NOT NULL,
  rating         NUMERIC(2,1) NOT NULL
                   CHECK (rating >= 1.0 AND rating <= 5.0),
  source         TEXT NOT NULL,                       -- 필수 (하네스 규칙)
  sentiment      TEXT NOT NULL DEFAULT 'neutral'
                   CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  author_name    TEXT,                                -- PII 주의: 로그 출력 금지
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON public.reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment     ON public.reviews(restaurant_id, sentiment);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Authenticated users can view reviews'
  ) THEN
    CREATE POLICY "Authenticated users can view reviews"
      ON public.reviews FOR SELECT TO authenticated USING (true);
  END IF;
END $$;


-- ========================================
-- reservations 테이블
-- 음식점별 예약 정보 (1:1). 데이터 없으면 "unknown" 취급.
-- ========================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id     TEXT NOT NULL UNIQUE                        -- 1 restaurant : 1 reservation row
                      REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (status IN (
                        'available_online',   -- 온라인 예약 가능
                        'available_phone',    -- 전화 예약만
                        'walk_in_only',       -- 예약 없이 이용만
                        'unavailable',        -- 예약 불가
                        'unknown'             -- 정보 없음
                      )),
  link              TEXT NOT NULL DEFAULT '',                   -- 빈 문자열 = 예약 링크 없음
  phone             TEXT,                                       -- 전화 예약 번호
  walk_in_available BOOLEAN NOT NULL DEFAULT false,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON public.reservations(restaurant_id);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'Authenticated users can view reservations'
  ) THEN
    CREATE POLICY "Authenticated users can view reservations"
      ON public.reservations FOR SELECT TO authenticated USING (true);
  END IF;
END $$;


-- ========================================
-- waiting 테이블
-- 음식점별 웨이팅 정보 (1:1). confidence 필수.
-- ========================================
CREATE TABLE IF NOT EXISTS public.waiting (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id         TEXT NOT NULL UNIQUE
                          REFERENCES public.restaurants(id) ON DELETE CASCADE,
  minutes               INTEGER NOT NULL DEFAULT 0,
  evidence              TEXT NOT NULL DEFAULT '',               -- 빈 문자열이면 confidence=estimated/unknown 강제
  confidence            TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (confidence IN ('realtime', 'estimated', 'unknown')),
  estimated_range_min   INTEGER,                               -- confidence='estimated'일 때 범위
  estimated_range_max   INTEGER,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiting_restaurant_id ON public.waiting(restaurant_id);

ALTER TABLE public.waiting ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'waiting' AND policyname = 'Authenticated users can view waiting'
  ) THEN
    CREATE POLICY "Authenticated users can view waiting"
      ON public.waiting FOR SELECT TO authenticated USING (true);
  END IF;
END $$;


-- ========================================
-- 자동 updated_at 트리거 (menus, reservations, waiting)
-- ========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER menus_updated_at
  BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER waiting_updated_at
  BEFORE UPDATE ON public.waiting
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('menus', 'reviews', 'reservations', 'waiting')
ORDER BY table_name;
