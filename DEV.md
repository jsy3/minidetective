# 로컬 실행 가이드

## localhost에서 실행 (브라우저)

1. 터미널에서 실행:
   ```bash
   npm run dev
   ```
2. 브라우저에서 **http://localhost:5175** 로 접속하세요.

- 화면이 비어 있거나 오류가 나면, 페이지에 표시되는 오류 메시지를 확인하거나 브라우저 개발자 도구(F12) → Console 탭에서 에러를 확인하세요.

## 샌드박스(토스 앱)에서 실행

웹 프로젝트는 **Metro가 아닌 Vite** 로 동작합니다. 샌드박스는 개발 서버 URL(WebView)로 접속합니다.

1. **개발 서버 먼저 실행** (별도 터미널):
   ```bash
   npm run dev
   ```
   → `http://localhost:5175` (및 네트워크 IP)에서 서버가 떠 있어야 합니다.

2. **granite.config.ts** 에서 샌드박스가 접속할 주소 확인:
   - `web.host`: 현재 `localhost` → **실기기/에뮬레이터에서 접속하려면 본인 PC의 IP**로 바꿔야 합니다 (예: `192.168.0.10`).
   - `web.port`: `5175` (Vite와 동일하게 유지).

3. **Granite로 샌드박스 실행** (선택):
   ```bash
   npm run dev:granite
   ```
   - 이 명령이 Vite를 대신 실행해 줄 수도 있고, 샌드박스 앱만 띄울 수도 있습니다.
   - "Metro 서버 연결 오류"가 나오면: 이 프로젝트는 **웹(Vite) 전용**이라 Metro를 쓰지 않습니다.  
     → 먼저 `npm run dev` 로 Vite를 띄운 뒤, 샌드박스 앱에서 연결할 URL을 `http://본인PC_IP:5175` 로 설정해 사용하세요.

## 요약

| 목적           | 명령          | 접속 주소              |
|----------------|---------------|-------------------------|
| 브라우저에서만 | `npm run dev` | http://localhost:5175  |
| 샌드박스 연동  | 1) `npm run dev` 2) granite.config의 host를 PC IP로 변경 후 샌드박스에서 해당 URL 접속 | http://본인PC_IP:5175 |
