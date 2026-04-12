import { baseURL } from '../config/api.js';

async function parseResponseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `서버 응답(JSON 아님): ${text.slice(0, 200)}`,
    };
  }
}

/**
 * 백엔드/토스 OAuth 오류 본문을 사용자용 문자열로 (문서: invalid_grant, resultType FAIL 등)
 * @param {Record<string, unknown>|null|undefined} data
 */
export function messageFromApiError(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;
  const e = data.error;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && typeof e.reason === 'string') return e.reason;
  if (e && typeof e === 'object' && typeof e.errorCode === 'string') {
    return e.reason ? `${e.errorCode}: ${e.reason}` : e.errorCode;
  }
  return fallback;
}

export async function post(url, body, token) {
  const res = await fetch(`${baseURL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponseBody(res);
  if (res.ok) return data ?? {};
  const fallback = `요청 실패 (${res.status} ${res.statusText || 'Unknown'})`;
  throw new Error(messageFromApiError(data, fallback));
}

export async function get(url, token) {
  const res = await fetch(`${baseURL}${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await parseResponseBody(res);
  if (res.ok) return data ?? {};
  const fallback = `요청 실패 (${res.status} ${res.statusText || 'Unknown'})`;
  throw new Error(messageFromApiError(data, fallback));
}
