/**
 * The single source of truth for the API base URL (BUG-11 fix).
 *
 * axios.ts and realtime/echo.ts used to each hardcode their own fallback for
 * when VITE_API_BASE_URL isn't set — axios fell back to a placeholder
 * domain ('http://nep-server.org/api') while echo fell back to a local dev
 * URL ('http://localhost:8000/api'). Whenever the env var was missing,
 * ordinary API calls and the realtime broadcasting-auth handshake silently
 * targeted two different hosts. Both now import this one constant instead.
 *
 * '/api' (relative, same-origin) matches the documented default in
 * .env.example and works for any deployment where the frontend is served
 * from — or proxied to — the same origin as the API.
 */
// Trailing slash stripped so consumers can safely do `${API_BASE_URL}/some/path`
// without risking a double slash (e.g. a hosting-platform env var set to
// "https://host/api/" instead of "https://host/api" would otherwise 404).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
