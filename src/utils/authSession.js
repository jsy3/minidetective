const ACCESS_TOKEN_STORAGE_KEY = 'minidetective.accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'minidetective.refreshToken';

export function readStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function persistAccessToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function readStoredRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function persistRefreshToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    return;
  }
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearStoredAuth() {
  persistAccessToken(null);
  persistRefreshToken(null);
}
