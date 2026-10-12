/** Parse an event id from a full URL, path, or raw id string. */
export function extractEventId(input) {
  const value = input.trim();
  if (!value) return '';

  let parts = [];
  try {
    const url = new URL(value);
    parts = url.pathname.split('/').filter(Boolean);
  } catch {
    parts = value.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  }

  const eIndex = parts.indexOf('e');
  if (eIndex >= 0 && parts[eIndex + 1]) {
    return parts[eIndex + 1];
  }

  if (parts[0] && parts[0] !== 'org') {
    return parts[0];
  }

  return '';
}
