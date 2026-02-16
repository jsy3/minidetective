const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * 토스 API 호출용 mTLS 클라이언트.
 * CLIENT_CERT_PATH, CLIENT_KEY_PATH 가 설정된 경우에만 사용.
 */
function createTLSClient(certPath, keyPath) {
  const resolvedCert = path.resolve(process.cwd(), certPath);
  const resolvedKey = path.resolve(process.cwd(), keyPath);

  if (!fs.existsSync(resolvedCert) || !fs.existsSync(resolvedKey)) {
    return null;
  }

  const options = {
    cert: fs.readFileSync(resolvedCert),
    key: fs.readFileSync(resolvedKey),
    rejectUnauthorized: true,
  };

  return {
    post(url, body) {
      return new Promise((resolve, reject) => {
        const u = new URL(url);
        const data = JSON.stringify(body);
        const req = https.request(
          {
            ...options,
            hostname: u.hostname,
            port: u.port || 443,
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Length': Buffer.byteLength(data),
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
            ...options,
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

module.exports = { createTLSClient };
