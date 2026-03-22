const https = require('https');
const fs = require('fs');
const path = require('path');

function makeClient(options) {
  const tlsOptions = {
    ...options,
    rejectUnauthorized: true,
  };

  return {
    post(url, body, headers = {}) {
      return new Promise((resolve, reject) => {
        const u = new URL(url);
        const data = JSON.stringify(body);
        const req = https.request(
          {
            ...tlsOptions,
            hostname: u.hostname,
            port: u.port || 443,
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Length': Buffer.byteLength(data),
              ...headers,
            },
          },
          (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, data: raw }));
          }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    },
    get(url, headers = {}) {
      return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request(
          {
            ...tlsOptions,
            hostname: u.hostname,
            port: u.port || 443,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              ...headers,
            },
          },
          (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, data: raw }));
          }
        );
        req.on('error', reject);
        req.end();
      });
    },
  };
}

/**
 * 토스 API 호출용 mTLS 클라이언트.
 * CLIENT_CERT_PATH, CLIENT_KEY_PATH 가 설정된 경우에 사용.
 */
function createTLSClient(certPath, keyPath) {
  const resolvedCert = path.resolve(process.cwd(), certPath);
  const resolvedKey = path.resolve(process.cwd(), keyPath);

  if (!fs.existsSync(resolvedCert) || !fs.existsSync(resolvedKey)) {
    return null;
  }

  return makeClient({
    cert: fs.readFileSync(resolvedCert),
    key: fs.readFileSync(resolvedKey),
  });
}

/**
 * 배포 환경에서 파일 없이 mTLS 인증서를 사용하기 위한 생성기.
 */
function createTLSClientFromBase64(certBase64, keyBase64) {
  if (!certBase64 || !keyBase64) {
    return null;
  }
  try {
    return makeClient({
      cert: Buffer.from(certBase64, 'base64'),
      key: Buffer.from(keyBase64, 'base64'),
    });
  } catch {
    return null;
  }
}

module.exports = { createTLSClient, createTLSClientFromBase64 };
