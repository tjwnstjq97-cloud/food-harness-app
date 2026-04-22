-- ================================================
-- test_domain_data.sql
-- menus / reviews / reservations / waiting 샘플 데이터
--
-- 실행 방법: Supabase 대시보드 > SQL Editor > 이 파일 붙여넣기 > Run
-- 전제조건:
--   1. 001, 002, 003 마이그레이션 실행 완료
--   2. test_restaurants.sql 실행 완료 (test_kr_001 ~ test_gl_004 존재)
-- ================================================

-- ========================================
-- 기존 테스트 도메인 데이터 제거
-- ========================================
DELETE FROM public.reviews      WHERE restaurant_id LIKE 'test_%';
DELETE FROM public.menus        WHERE restaurant_id LIKE 'test_%';
DELETE FROM public.reservations WHERE restaurant_id LIKE 'test_%';
DELETE FROM public.waiting      WHERE restaurant_id LIKE 'test_%';


-- ========================================
-- menus — 명동 칼국수 (test_kr_001)
-- ========================================
INSERT INTO public.menus
  (restaurant_id, name, price, price_status, is_signature, source, mention_count, description)
VALUES
  ('test_kr_001', '명동 칼국수',   9000,  'confirmed',  true,  'naver_place', 142, '직접 뽑은 면발, 시원한 국물'),
  ('test_kr_001', '비빔국수',      8000,  'confirmed',  false, 'naver_place',  38, NULL),
  ('test_kr_001', '만두 (6개)',    6000,  'estimated',  false, 'naver_place',  55, '직접 빚는 손만두');

-- menus — 강남 스시 오마카세 (test_kr_002)
INSERT INTO public.menus
  (restaurant_id, name, price, price_status, is_signature, source, mention_count, description)
VALUES
  ('test_kr_002', '런치 오마카세', 80000, 'confirmed',  true,  'naver_place', 203, '12피스 구성'),
  ('test_kr_002', '디너 오마카세', 150000,'confirmed',  true,  'naver_place', 189, '18피스 + 계절 요리'),
  ('test_kr_002', '단품 스시 세트', 45000,'estimated',  false, 'naver_place',  61, NULL);

-- menus — 이태원 버거 바 (test_kr_003)
INSERT INTO public.menus
  (restaurant_id, name, price, price_status, is_signature, source, mention_count, description)
VALUES
  ('test_kr_003', '시그니처 버거', 16000, 'confirmed', true,  'naver_place',  97, '더블 패티, 특제 소스'),
  ('test_kr_003', '클래식 버거',   13000, 'confirmed', false, 'naver_place',  42, NULL),
  ('test_kr_003', '감자튀김',       5000, 'confirmed', false, 'naver_place',  88, NULL);

-- menus — Ichiran Ramen (test_gl_001)
INSERT INTO public.menus
  (restaurant_id, name, price, price_status, is_signature, source, mention_count, description)
VALUES
  ('test_gl_001', 'Tonkotsu Ramen',   1190, 'confirmed', true,  'google_places', 512, 'Rich pork bone broth'),
  ('test_gl_001', 'Ramen + Kaedama',  1490, 'confirmed', false, 'google_places', 203, 'Extra noodle refill set');


-- ========================================
-- reviews — 명동 칼국수 (test_kr_001)
-- ========================================
INSERT INTO public.reviews
  (restaurant_id, text, rating, source, sentiment, author_name)
VALUES
  ('test_kr_001', '국물이 정말 시원하고 칼국수 면발이 쫄깃해요. 점심시간엔 웨이팅이 있지만 충분히 기다릴 가치가 있어요!', 4.5, 'naver', 'positive', NULL),
  ('test_kr_001', '만두도 맛있고 전체적으로 가성비가 좋습니다. 명동 방문 시 꼭 들르는 곳이에요.', 5.0, 'naver', 'positive', NULL),
  ('test_kr_001', '웨이팅이 길어서 조금 힘들었지만 음식은 맛있었습니다.', 3.5, 'kakao', 'neutral', NULL),
  ('test_kr_001', '점심에 30분 넘게 기다렸는데 너무 오래 걸렸어요. 맛은 평범한 수준.', 2.5, 'naver', 'negative', NULL);

-- reviews — 강남 스시 오마카세 (test_kr_002)
INSERT INTO public.reviews
  (restaurant_id, text, rating, source, sentiment, author_name)
VALUES
  ('test_kr_002', '런치 오마카세가 퀄리티 대비 가격이 합리적입니다. 셰프님이 친절하게 설명해주셔서 좋았어요.', 5.0, 'naver', 'positive', NULL),
  ('test_kr_002', '생선의 신선도가 정말 최상급이었습니다. 예약은 필수예요!', 4.5, 'kakao', 'positive', NULL),
  ('test_kr_002', '가격이 비싸지만 퀄리티는 인정합니다. 다만 양이 적어서 배가 차지 않았어요.', 3.0, 'naver', 'negative', NULL);

-- reviews — 이태원 버거 바 (test_kr_003)
INSERT INTO public.reviews
  (restaurant_id, text, rating, source, sentiment, author_name)
VALUES
  ('test_kr_003', '시그니처 버거의 패티가 촉촉하고 소스가 맛있어요. 이태원 최고 버거 맛집!', 4.5, 'naver', 'positive', NULL),
  ('test_kr_003', '분위기도 좋고 직원들이 친절해요. 감자튀김도 바삭해서 좋았어요.', 4.0, 'kakao', 'positive', NULL),
  ('test_kr_003', '가격 대비 양이 좀 적은 것 같아요.', 3.5, 'naver', 'neutral', NULL);

-- reviews — Ichiran Ramen (test_gl_001)
INSERT INTO public.reviews
  (restaurant_id, text, rating, source, sentiment, author_name)
VALUES
  ('test_gl_001', 'Amazing solo dining concept. The rich tonkotsu broth is absolutely perfect!', 5.0, 'google', 'positive', NULL),
  ('test_gl_001', 'Unique experience eating alone in a booth. Broth could be a bit richer.', 4.0, 'google', 'positive', NULL),
  ('test_gl_001', 'Queue was very long. Waited over 40 minutes.', 3.0, 'google', 'negative', NULL);


-- ========================================
-- reservations
-- ========================================
INSERT INTO public.reservations
  (restaurant_id, status, link, phone, walk_in_available, note)
VALUES
  -- 강남 스시: 온라인 예약 필수
  ('test_kr_002', 'available_online', 'https://www.naver.com/booking/test_kr_002', NULL, false, '1달 전 예약 권장'),
  -- 명동 칼국수: 예약 없이 이용 (현장 방문)
  ('test_kr_001', 'walk_in_only',     '',                                           NULL, true,  '웨이팅 명단에 이름 등록 후 입장'),
  -- 이태원 버거: 현장 방문 가능, 전화 예약도 가능
  ('test_kr_003', 'available_phone',  '',                                           '02-5555-1234', true, NULL),
  -- Ichiran: 예약 불가 (줄 서서 입장)
  ('test_gl_001', 'unavailable',      '',                                           NULL, true,  'Walk-in only. Expect queue during peak hours');


-- ========================================
-- waiting
-- ========================================
INSERT INTO public.waiting
  (restaurant_id, minutes, evidence, confidence, estimated_range_min, estimated_range_max)
VALUES
  -- 명동 칼국수: 실시간 웨이팅 (네이버 제공)
  ('test_kr_001', 25, '네이버 실시간 웨이팅 데이터', 'realtime', NULL, NULL),
  -- 강남 스시: 추정 (리뷰 기반)
  ('test_kr_002', 0,  '리뷰 기반 추정 (예약 후 바로 입장)',  'estimated', 0, 5),
  -- 이태원 버거: 추정 (피크타임 기준)
  ('test_kr_003', 15, '피크타임 평균 대기 (추정)',  'estimated', 10, 20),
  -- Ichiran: 실시간 (Google 제공)
  ('test_gl_001', 40, 'Google Popular Times 기반', 'estimated', 30, 60);


-- ========================================
-- 삽입 확인
-- ========================================
SELECT 'menus'       AS tbl, COUNT(*) FROM public.menus        WHERE restaurant_id LIKE 'test_%'
UNION ALL
SELECT 'reviews',           COUNT(*) FROM public.reviews       WHERE restaurant_id LIKE 'test_%'
UNION ALL
SELECT 'reservations',      COUNT(*) FROM public.reservations  WHERE restaurant_id LIKE 'test_%'
UNION ALL
SELECT 'waiting',           COUNT(*) FROM public.waiting       WHERE restaurant_id LIKE 'test_%'
ORDER BY tbl;
