// 토스 로그인 백엔드 origin (문서: generate-token 등은 서버에서만 호출)
// @see https://developers-apps-in-toss.toss.im/login/develop.html
// - 개발: '' + Vite 프록시 → localhost:4000
// - 프로덕션: VITE_SERVER_BASE_URL → REPO_TOKEN_SERVER_ORIGIN → ''(동일 출처)
const envURL = (import.meta.env.VITE_SERVER_BASE_URL ?? '').trim().replace(/\/$/, '');

/** Vercel 프로덕션 토큰 서버 (배포 별칭). VITE_SERVER_BASE_URL 이 있으면 그쪽이 우선입니다. */
const REPO_TOKEN_SERVER_ORIGIN = 'https://server-psi-sandy-87.vercel.app';

const prodOrigin = (envURL || REPO_TOKEN_SERVER_ORIGIN).trim().replace(/\/$/, '');
export const baseURL = import.meta.env.DEV ? '' : prodOrigin;
