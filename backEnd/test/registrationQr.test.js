const assert = require('assert');
const qrcode = require('qrcode');
const {
  qrBufferToDataUrl,
  buildRegisterSuccessBody,
  buildResendBody,
} = require('../registrationQr');

async function main() {
  const token = 'v1.test-registration-qr-payload';
  const buf = await qrcode.toBuffer(token);

  const dataUrl = qrBufferToDataUrl(buf);
  assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(dataUrl.length > 100);
  const decoded = Buffer.from(dataUrl.split(',')[1], 'base64');
  assert.ok(decoded.equals(buf));

  assert.throws(() => qrBufferToDataUrl(null), /qrBuffer must be a Buffer/);
  assert.throws(() => qrBufferToDataUrl('nope'), /qrBuffer must be a Buffer/);

  const okBody = buildRegisterSuccessBody({ emailSent: true, qrBuffer: buf });
  assert.equal(okBody.emailSent, true);
  assert.equal(okBody.success, 'Created');
  assert.equal(okBody.qrDataUrl, dataUrl);

  const failBody = buildRegisterSuccessBody({ emailSent: false, qrBuffer: buf });
  assert.equal(failBody.emailSent, false);
  assert.match(failBody.success, /could not be sent/i);
  assert.ok(failBody.qrDataUrl.startsWith('data:image/png;base64,'));

  const resendOk = buildResendBody({ emailSent: true });
  assert.deepEqual(resendOk, {
    success: 'Confirmation email sent',
    emailSent: true,
  });

  const resendFail = buildResendBody({ emailSent: false });
  assert.equal(resendFail.emailSent, false);
  assert.match(resendFail.success, /could not be sent/i);

  console.log('PASS  qrBufferToDataUrl encodes PNG');
  console.log('PASS  buildRegisterSuccessBody includes QR always');
  console.log('PASS  buildResendBody emailSent branches');
  console.log('\nAll registration QR tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
