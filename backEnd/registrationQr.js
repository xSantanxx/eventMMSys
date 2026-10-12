/**
 * Helpers for registration QR payloads (PNG data URLs + response bodies).
 */

function qrBufferToDataUrl(qrBuffer) {
  if (!qrBuffer || !Buffer.isBuffer(qrBuffer)) {
    throw new Error('qrBuffer must be a Buffer');
  }
  return `data:image/png;base64,${qrBuffer.toString('base64')}`;
}

function buildRegisterSuccessBody({ emailSent, qrBuffer }) {
  const sent = Boolean(emailSent);
  return {
    success: sent
      ? 'Created'
      : 'Registered, but the confirmation email could not be sent. You can still use the QR below or resend the email.',
    emailSent: sent,
    qrDataUrl: qrBufferToDataUrl(qrBuffer),
  };
}

function buildResendBody({ emailSent }) {
  const sent = Boolean(emailSent);
  return {
    success: sent
      ? 'Confirmation email sent'
      : 'Confirmation email could not be sent. Try again or use the QR on this page.',
    emailSent: sent,
  };
}

module.exports = {
  qrBufferToDataUrl,
  buildRegisterSuccessBody,
  buildResendBody,
};
