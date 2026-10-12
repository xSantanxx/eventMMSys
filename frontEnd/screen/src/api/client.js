const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_PORT || 3000}`;

export function apiUrl(path) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getToken() {
  return localStorage.getItem('eventmm_token');
}

export function setSession(token, organizer) {
  localStorage.setItem('eventmm_token', token);
  localStorage.setItem('eventmm_organizer', JSON.stringify(organizer));
}

export function clearSession() {
  localStorage.removeItem('eventmm_token');
  localStorage.removeItem('eventmm_organizer');
}

export function getStoredOrganizer() {
  try {
    const raw = localStorage.getItem('eventmm_organizer');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
}

/** Public attendee registration URL for sharing. */
export function getPublicRegisterUrl(eventId) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/e/${eventId}/register`;
}
