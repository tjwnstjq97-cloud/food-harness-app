-- ================================================
-- test_restaurants.sql
-- 앱 검색 동작 확인용 샘플 restaurants 데이터
--
-- 실행 방법: Supabase 대시보드 > SQL Editor > 이 파일 붙여넣기 > Run
-- 전제조건: 002_add_profiles_and_restaurants.sql 실행 완료
-- ================================================

-- 기존 테스트 데이터 제거 (중복 방지)
DELETE FROM public.restaurants WHERE id LIKE 'test_%';

-- ========================================
-- KR 음식점 샘플 (서울/부산)
-- ========================================
INSERT INTO public.restaurants (id, name, region, category, address, phone, latitude, longitude, source) VALUES
  ('test_kr_001', '명동 칼국수', 'KR', '한식', '서울특별시 중구 명동길 14', '02-1234-5678', 37.5637, 126.9851, 'naver'),
  ('test_kr_002', '강남 스시 오마카세', 'KR', '일식', '서울특별시 강남구 테헤란로 123', '02-9876-5432', 37.4981, 127.0276, 'naver'),
  ('test_kr_003', '이태원 버거 바', 'KR', '양식', '서울특별시 용산구 이태원로 200', '02-5555-1234', 37.5345, 126.9940, 'naver'),
  ('test_kr_004', '홍대 떡볶이 천국', 'KR', '분식', '서울특별시 마포구 홍익로 5길 20', NULL, 37.5574, 126.9234, 'naver'),
  ('test_kr_005', '부산 해운대 횟집', 'KR', '해산물', '부산광역시 해운대구 해운대해변로 264', '051-741-0001', 35.1620, 129.1631, 'naver'),
  ('test_kr_006', '종로 삼겹살 맛집', 'KR', '고기', '서울특별시 종로구 종로 99', '02-7777-8888', 37.5703, 126.9921, 'naver'),
  ('test_kr_007', '성수 카페 브런치', 'KR', '카페', '서울특별시 성동구 성수이로 77', NULL, 37.5447, 127.0558, 'naver'),
  ('test_kr_008', '신사 파스타 하우스', 'KR', '이탈리안', '서울특별시 강남구 가로수길 10', '02-3333-9999', 37.5186, 127.0228, 'naver');

-- ========================================
-- GLOBAL 음식점 샘플 (도쿄/뉴욕)
-- ========================================
INSERT INTO public.restaurants (id, name, region, category, address, phone, latitude, longitude, source) VALUES
  ('test_gl_001', 'Ichiran Ramen Shibuya', 'GLOBAL', 'Ramen', '1-22-7 Dogenzaka, Shibuya, Tokyo', '+81-3-3462-1234', 35.6590, 139.6991, 'google'),
  ('test_gl_002', 'Tsukiji Sushisay', 'GLOBAL', 'Sushi', '4-13-9 Tsukiji, Chuo, Tokyo', '+81-3-3541-5678', 35.6654, 139.7706, 'google'),
  ('test_gl_003', 'Katz''s Delicatessen', 'GLOBAL', 'Deli', '205 E Houston St, New York, NY', '+1-212-254-2246', 40.7223, -73.9873, 'google'),
  ('test_gl_004', 'Le Bernardin NYC', 'GLOBAL', 'French Seafood', '155 W 51st St, New York, NY', '+1-212-554-1515', 40.7625, -73.9815, 'google');

-- 삽입 확인
SELECT id, name, region, category FROM public.restaurants ORDER BY region, name;
