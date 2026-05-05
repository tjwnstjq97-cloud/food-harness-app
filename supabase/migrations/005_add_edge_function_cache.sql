-- ================================================
-- 005_add_edge_function_cache.sql
-- Edge Function 결과 캐시 (Anthropic 토큰 절약 + 응답 속도)
--
-- 목적:
--   - summarize-reviews: Claude API 호출 비용이 큼. 같은 음식점은 리뷰가 변하지
--     않았으면 이전 요약 재사용 → 토큰 사용량 거의 0으로 감소.
--   - search-restaurant: Naver API는 무료지만 응답 시간 단축 (TTL 24h).
--
-- staleness 감지:
--   - search_cache: TTL 기반 (created_at + 24h)
--   - review_summary_cache: source_hash 기반 (수집된 리뷰 URL 정렬+SHA-256)
--     → 새 블로그/카페 글이 등장하면 hash가 바뀌어 자동 재요약
--
-- RLS:
--   - 두 테이블 모두 service_role 만 접근 (Edge Function 내부 전용)
--   - 일반 사용자는 직접 읽기/쓰기 불가
--
-- 실행 방법: Supabase 대시보드 > SQL Editor > 이 파일 붙여넣기 > Run
-- 전제조건: 001~004 마이그레이션 실행 완료
-- ================================================

-- ========================================
-- 1) search_cache: 검색 결과 캐시 (TTL 기반)
-- ========================================
CREATE TABLE IF NOT EXISTS public.search_cache (
  cache_key   TEXT PRIMARY KEY,                  -- "{region}:{query_normalized}"
  region      TEXT NOT NULL CHECK (region IN ('KR', 'GLOBAL')),
  query       TEXT NOT NULL,
  results     JSONB NOT NULL,                    -- RestaurantResult[]
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  hit_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON public.search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_region ON public.search_cache(region);

ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- 일반 사용자/anon: 읽기/쓰기 모두 차단. service_role만 통과 (Edge Function 내부에서 사용).
-- (RLS는 service_role을 무조건 통과시킴 — 별도 policy 불필요)

-- ========================================
-- 2) review_summary_cache: AI 요약 캐시 (source_hash 기반 stale 감지)
-- ========================================
CREATE TABLE IF NOT EXISTS public.review_summary_cache (
  cache_key   TEXT PRIMARY KEY,                  -- "{region}:{restaurant_name_normalized}"
  region      TEXT NOT NULL CHECK (region IN ('KR', 'GLOBAL')),
  restaurant_name TEXT NOT NULL,
  source_hash TEXT NOT NULL,                     -- SHA-256 of sorted review URLs (staleness key)
  summary     JSONB NOT NULL,                    -- ReviewSummaryV2 (positive/negative/menus/sources)
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_summary_cache_region ON public.review_summary_cache(region);
CREATE INDEX IF NOT EXISTS idx_summary_cache_updated ON public.review_summary_cache(updated_at);

ALTER TABLE public.review_summary_cache ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3) 만료된 search_cache 정리 함수 (선택적: cron으로 호출 가능)
--    review_summary_cache는 source_hash가 갱신되면 UPSERT로 덮어쓰므로 별도 정리 불필요
-- ========================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_search_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.search_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ========================================
-- 4) hit_count 증가 RPC (캐시 히트 통계용)
-- ========================================
CREATE OR REPLACE FUNCTION public.increment_cache_hit(p_table TEXT, p_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_table = 'search_cache' THEN
    UPDATE public.search_cache SET hit_count = hit_count + 1 WHERE cache_key = p_key;
  ELSIF p_table = 'review_summary_cache' THEN
    UPDATE public.review_summary_cache SET hit_count = hit_count + 1 WHERE cache_key = p_key;
  END IF;
END;
$$;

-- ========================================
-- 검증 쿼리 (Run 후 직접 실행해서 확인용)
-- ========================================
-- SELECT * FROM public.search_cache LIMIT 5;
-- SELECT * FROM public.review_summary_cache LIMIT 5;
-- SELECT public.cleanup_expired_search_cache();  -- 만료 정리 (수동 실행)
