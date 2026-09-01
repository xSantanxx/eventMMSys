const API_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_PORT || 3000}`;

export function apiUrl(path) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
