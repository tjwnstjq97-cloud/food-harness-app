# Supabase 연결 가이드

## 필요한 환경변수

| 변수명 | 용도 | 위치 |
|--------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 클라이언트 (앱) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | 클라이언트 (앱) |

> `EXPO_PUBLIC_` 접두사가 붙은 변수만 클라이언트에 노출됩니다.
> 네이버/구글 API Key는 Edge Function에서만 사용하므로 `EXPO_PUBLIC_` 없이 관리합니다.

## 단계별 설정 방법

### 1단계: Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New project" 클릭
5. 프로젝트 이름: `food-harness-app` (임시)
6. Database Password 설정 → 안전한 곳에 보관
7. Region: `Northeast Asia (Seoul)` 선택
8. "Create new project" 클릭

### 2단계: 키 복사
1. 프로젝트 대시보드 → 좌측 메뉴 "Settings" → "API"
2. 아래 2개를 복사:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon (public)** Key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3단계: .env 파일 생성
```bash
cd /Users/seojunseop/Desktop/food-harness-app
cp .env.example .env
```
복사한 값을 .env에 입력:
```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4단계: 연결 테스트 방법
앱을 실행한 뒤 콘솔에서 확인:
```bash
npx expo start
```
- 콘솔에 `[Supabase] ... 설정되지 않았습니다.` 경고가 나오면 → .env 미설정
- 경고 없이 시작되면 → 연결 성공

또는 간단한 테스트 스크립트:
```typescript
// 임시 테스트 (app/(tabs)/index.tsx에 추가 후 삭제)
import { supabase } from '../../src/lib/supabase';
useEffect(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Supabase 연결:', error ? 'FAIL' : 'OK');
  });
}, []);
```

## 주의사항
- `.env` 파일은 절대 Git에 커밋하지 마세요 (.gitignore에 이미 추가됨)
- `anon` 키는 클라이언트에서 사용해도 안전 (RLS로 보호)
- `service_role` 키는 절대 클라이언트에 넣지 마세요
