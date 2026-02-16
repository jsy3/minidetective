import { useState } from 'react';
import { baseURL } from '../config/api.js';
import { post } from '../utils/fetcher.js';

/**
 * with-app-login 예제를 참고한 웹용 인증 훅.
 * appLogin()은 토스 앱 내에서만 동작하므로, 클릭 시점에 동적 로드합니다.
 */
export function useAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
  };

  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      const { appLogin } = await import('@apps-in-toss/web-framework');
      if (typeof appLogin !== 'function') throw new Error('appLogin not available');

      // 1. 토스 앱 로그인(필수 동의) → 인가 코드 발급
      const { authorizationCode, referrer } = await appLogin();

      // 개발 시에는 baseURL 빈 문자열(같은 출처 + Vite 프록시) 사용 가능
      if (!import.meta.env.DEV && !baseURL) {
        setError(
          '인가 코드를 받았어요. 토큰 발급을 위해 VITE_SERVER_BASE_URL을 설정하고, 토스 로그인 API(토큰 교환)를 연동해 주세요.'
        );
        return;
      }

      // 2. 서버에서 인가 코드로 토큰 교환 (개발: /get-access-token → Vite 프록시 → localhost:4000)
      const data = await post('/get-access-token', {
        authorizationCode,
        referrer,
      });

      const access = data?.data?.success?.accessToken;
      const refresh = data?.data?.success?.refreshToken;

      if (access) {
        setAccessToken(access);
        if (refresh) setRefreshToken(refresh);
      } else {
        const serverError = data?.error || data?.data?.error?.reason;
        setError(
          serverError ||
            'AccessToken을 가져오지 못했어요. 서버 API를 확인해 주세요.'
        );
      }
    } catch (e) {
      console.error('로그인 오류:', e);
      if (
        e?.message?.includes('ReactNativeWebView') ||
        e?.message?.includes('not available')
      ) {
        setError('토스 앱 내에서만 로그인할 수 있어요.');
      } else if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError')) {
        setError(
          '토큰 교환 서버에 연결할 수 없어요. 서버가 실행 중인지 확인하고, 샌드박스에서는 VITE_SERVER_BASE_URL을 PC IP(예: http://192.168.x.x:4000)로 설정해 주세요.'
        );
      } else {
        setError(`로그인 중 문제가 발생했어요. (${e?.message || '알 수 없는 오류'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    accessToken,
    refreshToken,
    login,
    clearTokens,
  };
}
