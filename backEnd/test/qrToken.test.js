const assert = require('assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-qr-tokens';

const {
  createSignedQrToken,
  verifySignedQrToken,
  isLegacyOpaqueToken,
} = require('../qrToken');

function main() {
  const eventId = 'eventaaaaaaaaaaaaaaaa';
  const attendeeId = 'attendeebbbbbbbbbbbb';
  const token = createSignedQrToken({ eventId, attendeeId });

  assert.ok(token.startsWith('v1.'), 'token has v1 prefix');
  const verified = verifySignedQrToken(token);
  assert.ok(verified, 'token verifies');
  assert.equal(verified.eventId, eventId);
  assert.equal(verified.attendeeId, attendeeId);

  const otherEvent = verifySignedQrToken(token);
  assert.notEqual(otherEvent.eventId, 'wrong-event');

  const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
  assert.equal(verifySignedQrToken(tampered), null, 'tampered token rejected');

  assert.equal(verifySignedQrToken('not-a-token'), null);
  assert.equal(verifySignedQrToken(cryptoHex()), null, 'legacy hex is not signed');
  assert.equal(isLegacyOpaqueToken(cryptoHex()), true);
  assert.equal(isLegacyOpaqueToken(token), false);

  // Same attendee/event still unique per call (nonce)
  const token2 = createSignedQrToken({ eventId, attendeeId });
  assert.notEqual(token, token2);

  console.log('PASS  create/verify signed QR token');
  console.log('PASS  reject tampered token');
  console.log('PASS  legacy opaque token helper');
  console.log('\nAll QR token tests passed');
}

function cryptoHex() {
  return require('crypto').randomBytes(16).toString('hex');
}

main();
