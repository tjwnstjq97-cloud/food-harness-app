# Food Harness App

음식점 탐색, 리뷰 요약, 예약/웨이팅 확인, 즐겨찾기와 방문 기록을 한 흐름으로 묶는 Expo 기반 모바일 앱입니다. 국내는 네이버, 해외는 Google 기반으로 검색과 지도 동작을 분기합니다.

## Status

- Expo Router + React Native + TypeScript
- Supabase Auth, PostgreSQL, RLS, Edge Function 연동
- Zustand + TanStack Query 기반 상태 관리
- Python validator 하네스로 도메인 규칙 검증
- 현재 검증 기준: TypeScript 통과, validator 16개 통과

## Main Features

- 이메일 회원가입 / 로그인
- KR / GLOBAL 지역 전환
- 음식점 검색, 최근 검색어, 카테고리 필터, 결과 하이라이트
- 음식점 상세: 메뉴, 리뷰, 예약, 웨이팅, 전화, 지도, 공유
- 사용자별 즐겨찾기와 방문 기록
- 지도 탭 빠른 검색
- Supabase Edge Function 기반 네이버 / Google Places 검색

## Tech Stack

- App: Expo, React Native, Expo Router, TypeScript
- State: Zustand, TanStack Query
- Backend: Supabase Auth, PostgreSQL, Edge Functions
- Harness: Python validators, shell hooks

## Getting Started

```bash
npm install
npm run start
```

iOS dev build가 필요한 경우:

```bash
npm run ios
```

Web 확인:

```bash
npm run web
```

## Environment

앱 실행에는 `.env` 파일이 필요합니다. `.env.example`을 참고해서 값을 채워주세요.

필수 클라이언트 변수:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

네이버 / Google API key는 클라이언트에 넣지 않고 Supabase Edge Function secrets로 관리합니다.

## Supabase Setup

Supabase SQL Editor에서 아래 순서로 실행합니다.

```text
supabase/migrations/001_create_tables.sql
supabase/migrations/002_add_profiles_and_restaurants.sql
supabase/migrations/003_add_domain_tables.sql
supabase/seed/test_restaurants.sql
supabase/seed/test_domain_data.sql
```

검색 Edge Function 배포:

```bash
npm run deploy:fn
```

## Verification

```bash
npm run typecheck
npm run validate
npm run check
```

`npm run validate`는 다음 규칙들을 검사합니다.

- 필수 필드 존재
- KR / GLOBAL region 분기
- 리뷰 source 필수
- 예약 링크 / 웨이팅 근거 정책
- 사용자 데이터 소유권 분리
- API key, service role, PII, debug log 노출 방지
- 메뉴 source와 restaurant region 필수

## Project Structure

```text
app/                 Expo Router screens
src/components/      Shared UI components
src/hooks/           Data and domain hooks
src/providers/       App-level providers
src/stores/          Zustand stores
src/types/           Domain types
src/utils/           Validators, map links, constants
supabase/            Migrations, seed data, edge functions
harness/             Validators and automation helpers
docs/                Architecture and testing notes
```

## Current Next Work

- 배너 이미지 최적화 또는 더 앱다운 일러스트로 교체
- 따뜻한 `Cozy Map Insight` 디자인 토큰 정리
- 홈 화면과 상세 페이지 리디자인
- 검색 결과 카드 정보 강화
- GitHub Actions CI 추가
- 지도 탭 실제 UI 뼈대 구현

## Handoff

다른 환경에서 이어서 작업할 때는 [docs/handoff.md](docs/handoff.md)를 먼저 확인하세요.
