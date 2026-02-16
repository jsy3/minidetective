// 토스 로그인: 토큰 교환 API 주소
// - 개발(DEV): 빈 문자열 → 같은 출처 호출, Vite가 /get-access-token 을 localhost:4000 으로 프록시
//   → 샌드박스/브라우저 모두 동일 출처로 요청하므로 연결 문제 해소
// - 프로덕션: VITE_SERVER_BASE_URL 사용 (배포 백엔드 주소)
const envURL = import.meta.env.VITE_SERVER_BASE_URL ?? '';
export const baseURL =
  import.meta.env.DEV ? '' : (envURL || 'http://localhost:4000');
