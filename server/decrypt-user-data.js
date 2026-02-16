const crypto = require('crypto');

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * AES-256-GCM 복호화 (토스 사용자 정보)
 * @param {string} encryptedBase64 - 암호문 Base64 (앞 12바이트 IV, 뒤 16바이트 태그)
 * @param {string} base64EncodedKey - 복호화 키 Base64
 * @param {string} aad - AAD (예: TOSS)
 * @returns {string} 복호화된 평문
 */
function decryptUserData(encryptedBase64, base64EncodedKey, aad) {
  if (!encryptedBase64 || typeof encryptedBase64 !== 'string') return null;
  const decoded = Buffer.from(encryptedBase64, 'base64');
  const key = Buffer.from(base64EncodedKey, 'base64');
  const iv = decoded.subarray(0, IV_LENGTH);
  const ciphertext = decoded.subarray(IV_LENGTH);
  const tag = ciphertext.subarray(ciphertext.length - TAG_LENGTH);
  const encrypted = ciphertext.subarray(0, ciphertext.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
}

/**
 * login-me 응답 success 객체의 암호화 필드 복호화
 */
function decryptUserInfo(userInfo, keyBase64, aad) {
  if (!userInfo || !keyBase64 || !aad) return userInfo;
  const fields = ['ci', 'name', 'phone', 'gender', 'nationality', 'birthday', 'email'];
  const out = { ...userInfo };
  for (const key of fields) {
    const value = userInfo[key];
    if (typeof value === 'string') {
      try {
        out[key] = decryptUserData(value, keyBase64, aad);
      } catch (e) {
        out[key] = value;
      }
    }
  }
  return out;
}

module.exports = { decryptUserData, decryptUserInfo };
