require('dotenv').config({ path: '.env.server' });
const express = require('express');
const cors = require('cors');
const { createTLSClient, createTLSClientFromBase64 } = require('./tls-client');
const { decryptUserInfo } = require('./decrypt-user-data');

const PORT = process.env.PORT || 4000;
const AUTH_API_BASE = process.env.AUTH_API_BASE || 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2';
const PROMOTION_API_BASE = process.env.PROMOTION_API_BASE || 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/promotion/execute-promotion';
const PROMOTION_CODE = process.env.PROMOTION_CODE || '01KHK7GMRDY7A4BVVP1HRN4XY8';
const DECRYPTION_KEY_BASE64 = process.env.DECRYPTION_KEY_BASE64;
const AAD_STRING = process.env.AAD_STRING || 'TOSS';
const MIN_PROMOTION_AMOUNT = 1;
const MAX_PROMOTION_AMOUNT = 5;

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

function failPayload(message, payload) {
  const errorCode = payload?.error?.errorCode;
  const reason = payload?.error?.reason;
  const extra = [errorCode, reason].filter(Boolean).join(': ');
  return {
    error: extra ? `${message} (${extra})` : message,
    data: payload ?? null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickRandomPromotionAmount() {
  return Math.floor(Math.random() * (MAX_PROMOTION_AMOUNT - MIN_PROMOTION_AMOUNT + 1)) + MIN_PROMOTION_AMOUNT;
}

function isValidPromotionAmount(amount) {
  return Number.isInteger(amount) && amount >= MIN_PROMOTION_AMOUNT && amount <= MAX_PROMOTION_AMOUNT;
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

async function executePromotionByUserKey(tossUserKey, amount) {
  if (!isValidPromotionAmount(amount)) {
    return {
      ok: false,
      statusCode: 500,
      payload: {
        error: `프로모션 지급 금액이 유효하지 않아요. (${amount})`,
      },
    };
  }

  const keyResponse = await tlsClient.post(
    `${PROMOTION_API_BASE}/get-key`,
    {},
    { 'x-toss-user-key': tossUserKey }
  );
  const keyParsed = parseJsonSafely(keyResponse.data);
  if (!keyParsed || keyResponse.statusCode !== 200 || !isSuccessResult(keyParsed)) {
    console.error('프로모션 key 발급 실패 응답:', keyParsed);
    return {
      ok: false,
      statusCode: keyResponse.statusCode || 502,
      payload: keyParsed
        ? failPayload('프로모션 key 발급 실패', keyParsed)
        : { error: '프로모션 key 발급 응답 파싱 실패' },
    };
  }

  const rewardKey = keyParsed?.success?.key;
  if (!rewardKey) {
    return {
      ok: false,
      statusCode: 502,
      payload: { error: '프로모션 key 발급에 실패했어요.' },
    };
  }

  const executeResponse = await tlsClient.post(
    `${PROMOTION_API_BASE}`,
    {
      promotionCode: PROMOTION_CODE,
      key: rewardKey,
      amount,
    },
    { 'x-toss-user-key': tossUserKey }
  );
  const executeParsed = parseJsonSafely(executeResponse.data);
  if (!executeParsed || executeResponse.statusCode !== 200 || !isSuccessResult(executeParsed)) {
    console.error('프로모션 지급 실행 실패 응답:', executeParsed);
    return {
      ok: false,
      statusCode: executeResponse.statusCode || 502,
      payload: executeParsed
        ? failPayload('프로모션 지급 실행 실패', executeParsed)
        : { error: '프로모션 지급 실행 응답 파싱 실패' },
    };
  }

  let resultParsed = null;
  let resultStatusCode = 0;
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const resultResponse = await tlsClient.post(
      `${PROMOTION_API_BASE}/execution-result`,
      {
        promotionCode: PROMOTION_CODE,
        key: rewardKey,
      },
      { 'x-toss-user-key': tossUserKey }
    );
    resultStatusCode = resultResponse.statusCode || 0;
    resultParsed = parseJsonSafely(resultResponse.data);

    if (!resultParsed || resultStatusCode !== 200) {
      const errorCode = resultParsed?.error?.errorCode;
      if (errorCode === '50000') {
        break;
      }
      console.error('프로모션 지급 결과 조회 실패 응답:', resultParsed);
      return {
        ok: false,
        statusCode: resultStatusCode || 502,
        payload: resultParsed
          ? failPayload('프로모션 지급 결과 조회 실패', resultParsed)
          : { error: '프로모션 지급 결과 조회 응답 파싱 실패' },
      };
    }

    if (!isSuccessResult(resultParsed)) {
      console.error('프로모션 지급 결과 조회 실패 응답:', resultParsed);
      const errorCode = resultParsed?.error?.errorCode;
      if (errorCode === '50000') {
        break;
      }
      return {
        ok: false,
        statusCode: resultStatusCode || 502,
        payload: failPayload('프로모션 지급 결과 조회 실패', resultParsed),
      };
    }

    const executionResult = resultParsed?.success;
    if (executionResult === 'SUCCESS') {
      break;
    }

    if (executionResult === 'FAILED') {
      return {
        ok: false,
        statusCode: 409,
        payload: failPayload('프로모션 지급 결과가 FAILED입니다.', resultParsed),
      };
    }

    if (attempt < maxAttempts) {
      await sleep(1000);
    }
  }

  if (resultParsed?.success !== 'SUCCESS') {
    const errorCode = resultParsed?.error?.errorCode;
    // 콘솔 테스트 단계에서 execution-result가 간헐적으로 50000을 반환할 수 있어,
    // execute-promotion 성공 시에는 완료로 간주하고 경고만 전달합니다.
    if (errorCode === '50000') {
      return {
        ok: true,
        statusCode: 200,
        payload: {
          key: rewardKey,
          amount,
          executionResult: 'UNKNOWN',
          executeResponse: executeParsed,
          resultResponse: resultParsed,
          warning: 'execution-result 조회에서 50000(Unknown error)이 발생했지만 지급 실행은 성공했습니다.',
        },
      };
    }

    return {
      ok: false,
      statusCode: 409,
      payload: failPayload(
        `프로모션 지급 결과가 아직 확정되지 않았어요. (${resultParsed?.success || 'UNKNOWN'})`,
        resultParsed
      ),
    };
  }

  return {
    ok: true,
    statusCode: 200,
    payload: {
      key: rewardKey,
      amount,
      executionResult: resultParsed?.success ?? 'UNKNOWN',
      executeResponse: executeParsed,
      resultResponse: resultParsed,
    },
  };
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

app.post('/grant-promotion-reward', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!accessToken) {
    return res.status(401).json({ error: 'Authorization: Bearer <accessToken> 필요' });
  }

  if (!PROMOTION_CODE) {
    return res.status(500).json({ error: '서버 설정 필요: PROMOTION_CODE 를 .env.server 에 설정하세요.' });
  }

  if (!tlsClient) {
    return res.status(500).json({
      error: '서버 설정 필요: CLIENT_CERT_PATH, CLIENT_KEY_PATH 를 .env.server 에 설정하세요.',
    });
  }

  try {
    const { response: userInfoResponse, parsed: userInfoParsed } =
      await fetchUserInfoByAccessToken(accessToken);
    if (!userInfoParsed || userInfoResponse.statusCode !== 200 || !isSuccessResult(userInfoParsed)) {
      return res.status(userInfoResponse.statusCode || 502).json(
        userInfoParsed || { error: '사용자 정보 조회 응답 파싱 실패' }
      );
    }

    const tossUserKey = userInfoParsed?.success?.userKey;
    if (!tossUserKey) {
      return res.status(400).json({ error: '토스 userKey를 찾을 수 없어요. 로그인 정보를 확인해 주세요.' });
    }

    const promotionAmount = pickRandomPromotionAmount();
    if (!isValidPromotionAmount(promotionAmount)) {
      return res.status(500).json({ error: `프로모션 지급 금액 검증에 실패했어요. (${promotionAmount})` });
    }
    const promotionResult = await executePromotionByUserKey(tossUserKey, promotionAmount);
    if (!promotionResult.ok) {
      return res.status(promotionResult.statusCode).json(promotionResult.payload);
    }

    return res.status(200).json({
      data: {
        ...promotionResult.payload,
        promotionCode: PROMOTION_CODE,
      },
    });
  } catch (e) {
    console.error('grant-promotion-reward 실패:', e);
    return res.status(500).json({
      error: e.message || '프로모션 지급 중 오류가 발생했습니다.',
    });
  }
});

app.post('/grant-promotion-reward-by-login', async (req, res) => {
  const { authorizationCode, referrer } = req.body || {};
  if (!authorizationCode || !referrer) {
    return res.status(400).json({
      error: 'authorizationCode, referrer 필요',
    });
  }

  if (!tlsClient) {
    return res.status(500).json({
      error: '서버 설정 필요: CLIENT_CERT_PATH, CLIENT_KEY_PATH 를 .env.server 에 설정하세요.',
    });
  }

  if (!PROMOTION_CODE) {
    return res.status(500).json({ error: '서버 설정 필요: PROMOTION_CODE 를 .env.server 에 설정하세요.' });
  }

  try {
    const { response: tokenResponse, parsed: tokenParsed } = await exchangeAccessToken({
      authorizationCode,
      referrer,
    });
    if (!tokenParsed) {
      return res.status(502).json({
        error: '토큰 교환 API가 비어있거나 JSON이 아닌 응답을 반환했어요.',
      });
    }
    if (tokenResponse.statusCode !== 200 || !isSuccessResult(tokenParsed)) {
      return res.status(tokenResponse.statusCode).json(tokenParsed);
    }

    const accessToken = tokenParsed?.success?.accessToken;
    if (!accessToken) {
      return res.status(502).json({ error: '토큰 교환 성공 응답에서 accessToken을 찾지 못했어요.' });
    }

    latestAccessTokenRecord = {
      accessToken,
      referrer,
      issuedAt: new Date().toISOString(),
    };

    const { response: userInfoResponse, parsed: userInfoParsed } =
      await fetchUserInfoByAccessToken(accessToken);
    if (!userInfoParsed || userInfoResponse.statusCode !== 200 || !isSuccessResult(userInfoParsed)) {
      return res.status(userInfoResponse.statusCode || 502).json(
        userInfoParsed || { error: '사용자 정보 조회 응답 파싱 실패' }
      );
    }

    const tossUserKey = userInfoParsed?.success?.userKey;
    if (!tossUserKey) {
      return res.status(400).json({ error: '토스 userKey를 찾을 수 없어요. 로그인 정보를 확인해 주세요.' });
    }

    const promotionAmount = pickRandomPromotionAmount();
    if (!isValidPromotionAmount(promotionAmount)) {
      return res.status(500).json({ error: `프로모션 지급 금액 검증에 실패했어요. (${promotionAmount})` });
    }
    const promotionResult = await executePromotionByUserKey(tossUserKey, promotionAmount);
    if (!promotionResult.ok) {
      return res.status(promotionResult.statusCode).json(promotionResult.payload);
    }

    return res.status(200).json({
      data: {
        accessToken,
        promotionCode: PROMOTION_CODE,
        ...promotionResult.payload,
      },
    });
  } catch (e) {
    console.error('grant-promotion-reward-by-login 실패:', e);
    return res.status(500).json({
      error: e.message || '로그인 기반 포인트 지급 중 오류가 발생했습니다.',
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
