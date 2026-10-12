/** Copy helpers for the post-registration QR success view. */

export function registrationSuccessMessage(emailSent) {
  return emailSent
    ? 'You are registered. Download this QR code (and check your email for a copy).'
    : 'You are registered. Download this QR code to check in — email delivery is optional.';
}

export function isPngDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/png;base64,');
}

/** Turn a PNG data URL into a safe download filename stem. */
export function qrDownloadFilename(eventName = 'event') {
  const stem = String(eventName || 'event')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${stem || 'event'}-check-in-qr.png`;
}

/**
 * Trigger a PNG download from a data URL.
 * Uses a Blob so it works more reliably than <a download href="data:...">.
 */
export function downloadPngDataUrl(dataUrl, filename = 'check-in-qr.png') {
  if (!isPngDataUrl(dataUrl)) {
    throw new Error('Expected a PNG data URL');
  }

  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'image/png' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
