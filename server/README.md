# 토스 로그인 토큰 교환 서버

앱인토스 토스 로그인 시 인가 코드 → AccessToken 교환을 위한 백엔드입니다.

## 1. 설치 및 인증서 설정

```bash
cd server
npm install
```

**mTLS 인증서**가 필요합니다.

- **앱인토스 콘솔**에서 발급한 클라이언트 인증서(공개키 `.crt`)와 비밀키(`.key`)를 준비합니다.
- 또는 **샌드박스/예제 테스트**용으로 `apps-in-toss-examples-main/with-app-login/server/cert/` 의 `mock_public.crt`, `mock_private.key` 를 이 서버의 `server/cert/` 에 복사해 사용할 수 있습니다.

## 2. 환경 변수

`server/.env.server` 파일을 만들고 아래를 설정합니다.

```env
PORT=4000
AUTH_API_BASE=https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2

# 발급받은 인증서 경로 (server 폴더 기준)
CLIENT_CERT_PATH=cert/mock_public.crt
CLIENT_KEY_PATH=cert/mock_private.key
```

인증서 경로는 본인 환경에 맞게 수정하세요.

## 3. 실행

```bash
npm start
```

`http://localhost:4000` 에서 동작합니다.

## 4. 프론트엔드와 함께 사용

프로젝트 루트 `.env` 또는 `.env.local` 에:

```env
VITE_SERVER_BASE_URL=http://localhost:4000
```

설정한 뒤 `npm run dev` 로 미니앱을 띄우고, 토스 로그인을 시도하면 이 서버로 토큰 교환이 요청됩니다.
