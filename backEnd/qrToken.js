require('dotenv').config();
const crypto = require('crypto');

function getQrSecret() {
  const secret = process.env.QR_HMAC_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('QR_HMAC_SECRET or JWT_SECRET must be set');
    err.code = 'QR_SECRET_MISSING';
    throw err;
  }
  return secret;
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64').toString('utf8');
}

function signPayload(payloadB64) {
  return crypto
    .createHmac('sha256', getQrSecret())
    .update(payloadB64)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Create a signed QR payload bound to event + attendee.
 * Format: v1.<payloadB64url>.<sigB64url>
 */
function createSignedQrToken({ eventId, attendeeId }) {
  const payload = {
    e: eventId,
    a: attendeeId,
    n: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const sig = signPayload(payloadB64);
  return `v1.${payloadB64}.${sig}`;
}

/**
 * Verify a signed token. Returns { eventId, attendeeId } or null.
 * Legacy opaque hex tokens (no v1. prefix) return null so callers can fall back.
 */
function verifySignedQrToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (!token.startsWith('v1.')) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [, payloadB64, sig] = parts;
  const expected = signPayload(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64));
    if (!payload.e || !payload.a) return null;
    return { eventId: payload.e, attendeeId: payload.a, nonce: payload.n };
  } catch {
    return null;
  }
}

function isLegacyOpaqueToken(token) {
  return typeof token === 'string' && /^[a-f0-9]{32}$/i.test(token);
}

module.exports = {
  createSignedQrToken,
  verifySignedQrToken,
  isLegacyOpaqueToken,
};
