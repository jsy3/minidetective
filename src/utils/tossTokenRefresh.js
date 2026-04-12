import { post, messageFromApiError } from './fetcher.js';

/** React StrictMode 이중 effect 등으로 동일 refresh 요청이 겹치지 않게 함 */
let refreshInFlight = null;

/**
 * 백엔드 POST /refresh-access-token → 토스 refresh-token (문서 §3, refresh 14일)
 * @returns {{ accessToken: string, refreshToken: string | null }}
 */
export async function requestTokenRefresh(refreshToken) {
  const rt = typeof refreshToken === 'string' ? refreshToken.trim() : '';
  if (!rt) {
    throw new Error('refreshToken이 없어요.');
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const data = await post('/refresh-access-token', { refreshToken: rt });

    const tossPayload = data?.data ?? null;
    if (tossPayload && tossPayload.resultType && tossPayload.resultType !== 'SUCCESS') {
      throw new Error(
        messageFromApiError(
          { error: tossPayload.error },
          '토큰 재발급에 실패했어요. 다시 로그인해 주세요.'
        )
      );
    }

    const successBlock = tossPayload?.success ?? data?.success;
    const accessToken = successBlock?.accessToken ?? null;
    const nextRefresh = successBlock?.refreshToken ?? null;

    if (!accessToken) {
      throw new Error(
        messageFromApiError(data, '재발급 응답에 accessToken이 없어요.')
      );
    }

    return {
      accessToken,
      refreshToken: nextRefresh || rt,
    };
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
