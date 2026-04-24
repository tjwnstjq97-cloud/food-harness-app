-- ================================================
-- 004_add_user_reviews.sql
-- 사용자 작성 리뷰 지원 (Phase 19)
--
-- 목적:
--   - 외부(naver/kakao/google) 리뷰 외에 사용자 본인이 직접 리뷰를 작성할 수 있도록 함
--   - 사용자 본인 리뷰만 INSERT/UPDATE/DELETE 가능 (RLS로 강제)
--   - 외부 리뷰는 user_id = NULL → 사용자가 수정/삭제 불가
--
-- 하네스 규칙 준수:
--   - source 필수 (사용자 리뷰는 source = 'user')
--   - sentiment 필수 (사용자가 별점에 따라 자동 분류 또는 직접 선택)
--   - 사용자별 데이터 소유권 분리 (user_id 컬럼 + RLS)
--
-- 실행 방법: Supabase 대시보드 > SQL Editor > 이 파일 붙여넣기 > Run
-- 전제조건: 001, 002, 003 마이그레이션 실행 완료
-- ================================================

-- ========================================
-- 1) reviews 테이블에 user_id 컬럼 추가
--    - NULL 허용 (외부 수집 리뷰는 user_id 없음)
--    - 사용자 삭제 시 user_id를 NULL로 (리뷰 자체는 보존, ON DELETE SET NULL)
-- ========================================
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 한 사용자가 한 음식점에 1개 리뷰만 (중복 방지)
-- user_id가 NULL인 외부 리뷰는 제약에서 제외 (UNIQUE는 NULL 다중 허용)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_unique_user_restaurant'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_unique_user_restaurant
      UNIQUE (user_id, restaurant_id);
  END IF;
END $$;


-- ========================================
-- 2) RLS 정책 추가 — INSERT/UPDATE/DELETE
--    SELECT는 003에서 이미 모든 인증 사용자에게 허용됨
-- ========================================

-- INSERT: 본인 user_id로만, 그리고 source='user'로만 작성 가능
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews' AND policyname = 'Users can insert own reviews'
  ) THEN
    CREATE POLICY "Users can insert own reviews"
      ON public.reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND source = 'user'
      );
  END IF;
END $$;

-- UPDATE: 본인 리뷰만 수정 가능
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews' AND policyname = 'Users can update own reviews'
  ) THEN
    CREATE POLICY "Users can update own reviews"
      ON public.reviews
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid() AND source = 'user');
  END IF;
END $$;

-- DELETE: 본인 리뷰만 삭제 가능
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews' AND policyname = 'Users can delete own reviews'
  ) THEN
    CREATE POLICY "Users can delete own reviews"
      ON public.reviews
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


-- ========================================
-- 3) 검증
-- ========================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reviews'
  AND column_name IN ('user_id', 'source', 'sentiment')
ORDER BY column_name;

SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;
