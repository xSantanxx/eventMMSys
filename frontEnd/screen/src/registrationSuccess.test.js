/**
 * Run: node src/registrationSuccess.test.js
 */
import assert from 'node:assert/strict';
import {
  isPngDataUrl,
  qrDownloadFilename,
  registrationSuccessMessage,
} from './registrationSuccess.js';

function main() {
  assert.match(registrationSuccessMessage(true), /download this qr/i);
  assert.match(registrationSuccessMessage(false), /download this qr/i);

  assert.equal(isPngDataUrl('data:image/png;base64,abc'), true);
  assert.equal(isPngDataUrl('data:image/jpeg;base64,abc'), false);
  assert.equal(isPngDataUrl(''), false);
  assert.equal(isPngDataUrl(null), false);

  assert.equal(qrDownloadFilename('Campus Meetup!'), 'campus-meetup-check-in-qr.png');
  assert.equal(qrDownloadFilename(''), 'event-check-in-qr.png');
  assert.equal(qrDownloadFilename('   '), 'event-check-in-qr.png');

  console.log('PASS  registration success copy');
  console.log('PASS  PNG data URL guard');
  console.log('PASS  QR download filename');
  console.log('\nAll registration success tests passed');
}

main();
