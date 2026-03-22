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
  const message =
    data?.error || `요청 실패 (${res.status} ${res.statusText || 'Unknown'})`;
  throw new Error(message);
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
  const message =
    data?.error || `요청 실패 (${res.status} ${res.statusText || 'Unknown'})`;
  throw new Error(message);
}
