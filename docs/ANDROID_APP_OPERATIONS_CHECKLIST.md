# Android 앱 운영/최적화 체크리스트 (푸드하네스앱)

최종 업데이트: 2026-05-22

이 문서는 **푸드하네스앱(Expo/React Native)** 을 Android에서 “운영 가능한 기본기” 수준으로 유지하기 위한 **project-local** 체크리스트입니다.

중앙 기준: `/Users/seojunseop/Documents/New project 9/.harness/pages/android-app-ops-optimization.md`

## 범위/금지 (자동작업 기준 고정)

- ✅ 허용: local-only docs/validator/typecheck/lint/dry-run, mock 흐름 안정화, 목록 성능 개선, fallback UI 개선
- ❌ 금지: `.env`/API key/Supabase secret/service-role 값 읽기/출력, Supabase migration 실행, Edge Function deploy/log/실호출, Android build/install/sign, production/staging deploy, destructive git

## 매 실행 Preflight (local-only)

- [ ] `git status --short --branch`로 dirty 상태를 **절대 되돌리지 않고** 파악
- [ ] `npm run check` (TypeScript + harness validators + dry-run)
- [ ] conflict marker/공백 오류: `git diff --check`

## 사용자 경로(Android) 핵심 UX 상태

### Pre-auth / Mock 흐름

- [ ] `/mock-search`가 **외부/DB 없이** 렌더되고, 검색/결과/상세/요약이 모두 “로딩/오류/빈 상태”를 가진다.
- [ ] `/login` ↔ `/register` 반복 이동에서 interactive node 수가 누적되지 않는다(내비게이션 스택 중복 방지).

### 네트워크/세션/권한 실패

- [ ] 네트워크 실패: “실패/재시도”가 짧고 명확하며, 빈 화면/무한 로딩이 없다.
- [ ] Supabase session 없음: 보호된 화면은 로그인 유도만 보여주고, 민감 정보/디버그 로그가 없다.
- [ ] 위치 권한 거부: 검색이 완전히 막히지 않고, “권한 없이도 가능한 동작”과 안내가 분리된다.

## 성능/안정성 기본기 (React Native/Expo)

### 긴 목록(검색 결과/리뷰/메뉴)

- [ ] 목록은 `FlatList`/가상화 기반으로 유지하고, item 컴포넌트는 `React.memo` 등으로 불필요한 리렌더를 줄인다.
- [ ] item `keyExtractor`는 안정적이며(고정 id), inline object/inline function 생성으로 render churn을 만들지 않는다.
- [ ] 스크롤 성능 악화 신호(버벅임/지연/프레임 드랍)가 보이면, 우선순위는:
  1) render 경량화(컴포넌트 분리, memo)
  2) stable callback(`useCallback`)
  3) 이미지/지도 placeholder/fallback
  4) 불필요한 state 파생 제거

### 이미지/지도 fallback

- [ ] 이미지 로드 실패 시 깨진 UI 대신 placeholder가 나온다.
- [ ] 지도 로드 실패/권한 거부 시 대체 UI(주소 텍스트/외부 지도 링크 등)가 나온다.

## 보안/개인정보/원문 노출 방지 (source-backed summary 방향)

- [ ] 화면/로그/캐시에 **raw provider body, raw prompt, credential, PII** 가 노출되지 않는다.
- [ ] source-backed summary가 불가능하면 `정보 없음`을 렌더한다(출처 없는 요약 금지).
- [ ] 리뷰/요약의 “근거”는 raw 본문이 아니라 **출처 메타데이터(예: provider, url, 시점, count)** 중심으로 표시한다.

## Expo 운영 검사 (local-only)

### ESLint (dotenv 차단 모드)

`.env`를 읽지 않는 상태에서 lint를 돌려 “운영 전 기본 검사”를 고정합니다.

```bash
npm run expo:lint
```

### 번들 분석 준비(문서/드라이런)

APK/AAB 빌드 없이도 “무거운 dependency/번들 크기”를 점검할 준비를 합니다.

```bash
# 필요 시: export 결과물은 로컬 산출물이며, 실제 설치/배포는 하지 않는다.
npm run expo:atlas:android
```

## 남은 체크포인트(자동작업에서 하지 않음)

- [ ] `expo run:android`, EAS build, 실기기 install/sign
- [ ] Play Console(Android vitals), Baseline Profile/Macrobenchmark
- [ ] Supabase migration 실행, Edge Function deploy/log 확인, 외부 리뷰 provider 실호출
