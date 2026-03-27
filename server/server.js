require('dotenv').config({ path: '.env.server' });
const express = require('express');
const cors = require('cors');
const { createTLSClient, createTLSClientFromBase64 } = require('./tls-client');
const { decryptUserInfo } = require('./decrypt-user-data');

const PORT = process.env.PORT || 4000;
const AUTH_API_BASE = process.env.AUTH_API_BASE || 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2';
const DECRYPTION_KEY_BASE64 = process.env.DECRYPTION_KEY_BASE64;
const AAD_STRING = process.env.AAD_STRING || 'TOSS';

const tlsClient = process.env.CLIENT_CERT_BASE64 && process.env.CLIENT_KEY_BASE64
  ? createTLSClientFromBase64(process.env.CLIENT_CERT_BASE64, process.env.CLIENT_KEY_BASE64)
  : (
    process.env.CLIENT_CERT_PATH && process.env.CLIENT_KEY_PATH
      ? createTLSClient(process.env.CLIENT_CERT_PATH, process.env.CLIENT_KEY_PATH)
      : null
  );

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
let latestAccessTokenRecord = null;

function parseJsonSafely(raw) {
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isSuccessResult(payload) {
  return payload?.resultType === 'SUCCESS';
}

async function exchangeAccessToken({ authorizationCode, referrer }) {
  const response = await tlsClient.post(`${AUTH_API_BASE}/generate-token`, {
    authorizationCode,
    referrer,
  });
  const parsed = parseJsonSafely(response.data);
  return { response, parsed };
}

async function fetchUserInfoByAccessToken(accessToken) {
  const response = await tlsClient.get(`${AUTH_API_BASE}/login-me`, {
    Authorization: `Bearer ${accessToken}`,
  });
  const parsed = parseJsonSafely(response.data);
  return { response, parsed };
}

app.post('/get-access-token', async (req, res) => {
  const { authorizationCode, referrer } = req.body || {};

  if (!authorizationCode || !referrer) {
    return res.status(400).json({
      error: 'authorizationCode, referrer 필요',
    });
  }

  if (!tlsClient) {
    console.error('mTLS 미설정: CLIENT_CERT_PATH, CLIENT_KEY_PATH 를 .env.server 에 설정하세요.');
    return res.status(500).json({
      error: '서버 설정 필요: 앱인토스 콘솔에서 발급한 인증서로 CLIENT_CERT_PATH, CLIENT_KEY_PATH 를 설정하세요.',
    });
  }

  try {
    const { response, parsed } = await exchangeAccessToken({
      authorizationCode,
      referrer,
    });
    if (!parsed) {
      return res.status(502).json({
        error: '토큰 교환 API가 비어있거나 JSON이 아닌 응답을 반환했어요.',
      });
    }

    if (response.statusCode !== 200 || !isSuccessResult(parsed)) {
      return res.status(response.statusCode).json(parsed);
    }

    const accessToken = parsed?.success?.accessToken ?? null;
    if (accessToken) {
      latestAccessTokenRecord = {
        accessToken,
        referrer,
        issuedAt: new Date().toISOString(),
      };
    }

    return res.status(200).json({
      statusCode: response.statusCode,
      data: parsed,
    });
  } catch (e) {
    console.error('get-access-token 실패:', e);
    res.status(500).json({
      error: e.message || '토큰 발급 중 오류가 발생했습니다.',
    });
  }
});

app.get('/latest-access-token', (req, res) => {
  if (!latestAccessTokenRecord) {
    return res.status(404).json({ error: '저장된 accessToken이 없어요. 먼저 토스 로그인을 진행해 주세요.' });
  }
  return res.status(200).json({ data: latestAccessTokenRecord });
});

// 사용자 정보 조회 (login-me) + 복호화
app.get('/get-user-info', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!accessToken) {
    return res.status(401).json({ error: 'Authorization: Bearer <accessToken> 필요' });
  }

  if (!tlsClient) {
    return res.status(500).json({
      error: '서버 설정 필요: CLIENT_CERT_PATH, CLIENT_KEY_PATH 를 설정하세요.',
    });
  }

  try {
    const response = await tlsClient.get(`${AUTH_API_BASE}/login-me`, {
      Authorization: `Bearer ${accessToken}`,
    });

    const parsed = parseJsonSafely(response.data);
    if (!parsed) {
      return res.status(502).json({
        error: '사용자 정보 API가 비어있거나 JSON이 아닌 응답을 반환했어요.',
      });
    }

    if (response.statusCode !== 200 || !isSuccessResult(parsed)) {
      return res.status(response.statusCode).json(parsed);
    }

    const success = parsed.success;
    if (success && DECRYPTION_KEY_BASE64 && AAD_STRING) {
      parsed.success = decryptUserInfo(success, DECRYPTION_KEY_BASE64, AAD_STRING);
    }

    res.status(200).json({
      statusCode: response.statusCode,
      data: parsed,
    });
  } catch (e) {
    console.error('get-user-info 실패:', e);
    res.status(500).json({
      error: e.message || '사용자 정보 조회 중 오류가 발생했습니다.',
    });
  }
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`토큰 교환 서버: http://localhost:${PORT}`);
    if (!tlsClient) {
      console.warn('⚠ mTLS 미설정. .env.server 에 CLIENT_CERT_PATH, CLIENT_KEY_PATH 를 설정한 뒤 재시작하세요.');
    }
  });
}
