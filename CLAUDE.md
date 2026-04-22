# CLAUDE.md - Food Harness App

## 프로젝트 개요
음식점 탐색/리뷰/예약 보조 앱. 하네스 엔지니어링 기반으로 구조를 먼저 잡고, 기능은 검증된 구조 위에서 확장한다.

## 핵심 원칙

### 작업 규칙
- 틀린 결과는 절대 완료로 간주하지 말 것
- validator 통과 전 완료 금지
- 코드 생성 전에 구조/파일 목록을 먼저 제안하고 승인받을 것
- 승인 없는 라이브러리 설치 금지
- 불확실한 것은 TODO로 남기고, 추측하지 말 것
- 작업 내역과 결정 사항은 항상 research.md에 누적 기록할 것

### 지도/지역 분기
- 국내(KR): 네이버 지도 기반
- 국외(GLOBAL): 구글 지도 기반
- region 분기 없이 지도 기능 구현 금지

### 리뷰
- 리뷰 출처(source) 없이 요약 금지
- 부정 리뷰와 긍정 리뷰 분리

### 예약
- 예약 정보가 없으면 추측 금지, "정보 없음" 처리
- 예약 링크(link)가 없으면 "정보 없음" 처리

### 웨이팅
- 웨이팅 정보는 근거 없으면 "추정"으로 표기

### 보안
- API Key, SECRET, TOKEN 하드코딩 금지
- 로그에 개인정보 저장 금지
- 보안 규칙 위반 시 실패 처리

### 환경변수 / .env 규칙 (절대 준수)
- **.env 파일을 절대 읽거나 수정하거나 생성하지 말 것** — 어떤 이유로도 예외 없음
- .env.example 도 값 변경 금지 (구조 설명용 주석만 수정 가능)
- 환경변수가 필요한 코드는 `process.env.EXPO_PUBLIC_*` 참조만 작성하고, 값은 사용자가 직접 .env에 입력
- API Key가 필요한 작업은 TODO 주석으로 표시하고 사용자에게 알릴 것
- Edge Function 환경변수(NAVER_*, GOOGLE_*) 설정은 사용자가 Supabase 대시보드에서 직접 수행

### 데이터 소유권
- 사용자 히스토리/즐겨찾기는 사용자별로 분리 (소유권 분리 필수)

## 기술 스택 (확정)
- 프론트엔드: React Native (Expo) + TypeScript
- 상태관리: Zustand (클라이언트) + TanStack Query (서버)
- 백엔드/DB: Supabase (PostgreSQL + Auth + Edge Functions)
- 지도: 네이버 지도 네이티브 SDK (KR) / Google Maps SDK (GLOBAL)
- 개발 순서: KR 먼저 → GLOBAL 확장

## Expo 규칙
- prebuild/dev build 전제 (네이버 지도 네이티브 SDK)
- EXPO_PUBLIC_ 접두사로 클라이언트 환경변수 노출
- 외부 API Key는 Edge Function에서만 사용, 클라이언트 노출 금지

## 프로젝트 구조
- app/ — Expo Router (파일 기반 라우팅)
- src/ — 앱 소스코드 (lib, providers, stores, types, utils, hooks)
- harness/ — 하네스 엔지니어링 (validators, hooks, tests, scripts)
- docs/ — 아키텍처 문서

## 작업 순서
하네스 우선, 기능 구현은 그다음.
