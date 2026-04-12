import { useState, useCallback } from 'react';
import { post, messageFromApiError } from '../utils/fetcher.js';
import {
  readStoredRefreshToken,
  persistAccessToken,
  persistRefreshToken,
} from '../utils/authSession.js';
import { requestTokenRefresh } from '../utils/tossTokenRefresh.js';

/**
 * 토스 로그인 — appLogin → 백엔드 POST generate-token (클라이언트에서 토스 OAuth URL 직접 호출 금지)
 * @see https://developers-apps-in-toss.toss.im/login/develop.html
 */
export function useAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(() => readStoredRefreshToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
  };

  /** 문서 §3 refresh-token — 저장된 refresh로 액세스 토큰 갱신 */
  const refreshAccessToken = useCallback(async (explicitRefresh) => {
    const rt =
      (typeof explicitRefresh === 'string' ? explicitRefresh.trim() : '') ||
      refreshToken ||
      readStoredRefreshToken() ||
      '';
    if (!rt) {
      setError('재발급할 refreshToken이 없어요. 다시 로그인해 주세요.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const out = await requestTokenRefresh(rt);
      setAccessToken(out.accessToken);
      setRefreshToken(out.refreshToken);
      persistAccessToken(out.accessToken);
      persistRefreshToken(out.refreshToken);
      return out;
    } catch (e) {
      console.error('토큰 재발급 오류:', e);
      setError(e?.message || '토큰 재발급에 실패했어요.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      const { appLogin } = await import('@apps-in-toss/web-framework');
      if (typeof appLogin !== 'function') throw new Error('appLogin not available');

      // 1. 인가 코드·referrer (문서: 샌드박스 referrer=sandbox, 토스앱 DEFAULT, 유효시간 10분)
      const raw = await appLogin();
      const authorizationCode =
        typeof raw?.authorizationCode === 'string' ? raw.authorizationCode.trim() : '';
      const referrer = typeof raw?.referrer === 'string' ? raw.referrer.trim() : '';

      if (!authorizationCode || !referrer) {
        setError(
          '로그인 응답에 인가 코드 또는 referrer가 없어요. 샌드박스는 개발자 로그인·앱인토스 문서 트러블슈팅을 확인해 주세요.'
        );
        return null;
      }

      // 2. 백엔드가 mTLS로 POST .../oauth2/generate-token 호출
      const data = await post('/get-access-token', {
        authorizationCode,
        referrer,
      });

      const tossPayload = data?.data ?? null;
      if (tossPayload && tossPayload.resultType && tossPayload.resultType !== 'SUCCESS') {
        const msg = messageFromApiError(
          { error: tossPayload.error },
          '토큰 발급에 실패했어요. 인가 코드 재사용·만료(10분)·invalid_grant 여부를 확인해 주세요.'
        );
        setError(msg);
        return null;
      }

      const successBlock = tossPayload?.success ?? data?.success;
      const access = successBlock?.accessToken;
      const refresh = successBlock?.refreshToken;

      if (access) {
        setAccessToken(access);
        if (refresh) setRefreshToken(refresh);
        return { accessToken: access, refreshToken: refresh ?? null };
      }

      setError(
        messageFromApiError(data, 'AccessToken을 가져오지 못했어요. 서버·앱인토스 콘솔 설정을 확인해 주세요.')
      );
      return null;
    } catch (e) {
      console.error('로그인 오류:', e);
      if (
        e?.message?.includes('ReactNativeWebView') ||
        e?.message?.includes('not available')
      ) {
        setError('토스 앱 내에서만 로그인할 수 있어요.');
      } else if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError')) {
        setError(
          '토큰 교환 서버에 연결할 수 없어요. 로컬은 npm run server·Vite 프록시, 배포는 api.js 토큰 서버·Vercel mTLS 인증서·네트워크를 확인해 주세요.'
        );
      } else {
        setError(`로그인 중 문제가 발생했어요. (${e?.message || '알 수 없는 오류'})`);
      }
      return null;
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
    refreshAccessToken,
    clearTokens,
  };
}
