import axios from "axios";

/**
 * ---------------------------------------------------------------------------
 * Central Axios instance + access-token store.
 * ---------------------------------------------------------------------------
 * Security model (matches the backend in /server):
 *  - The REFRESH token lives only in a secure, httpOnly, sameSite cookie set
 *    by the server. Client-side JS can never read or steal it (XSS-safe).
 *  - The ACCESS token is short-lived (15 min) and is kept ONLY in memory
 *    (a module-level variable), never in localStorage/sessionStorage. This
 *    means it disappears on tab close/refresh, which is intentional: on
 *    load we silently call POST /auth/refresh (cookie is sent automatically
 *    because of `withCredentials: true`) to mint a fresh access token.
 *  - Every request that gets a 401 automatically attempts exactly one
 *    silent refresh, then retries. If the refresh itself fails, the user is
 *    signed out. Concurrent 401s share a single in-flight refresh call so we
 *    never hammer the refresh endpoint.
 */

let accessToken = null;

/** Subscribers notified whenever the auth state is forcibly cleared (e.g. refresh failed). */
const unauthorizedListeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function notifyUnauthorized() {
  clearAccessToken();
  unauthorizedListeners.forEach((listener) => listener());
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  // Required so the httpOnly refresh-token cookie is sent to/received from the API.
  withCredentials: true,
});

// A separate, interceptor-free client for the refresh call itself, so it
// can never recursively trigger the 401 handler below.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

/** Calls POST /auth/refresh once, sharing the in-flight promise across concurrent callers. */
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then((res) => {
        const token = res.data?.data?.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Network error / no response at all — nothing to retry.
    if (!response) return Promise.reject(error);

    const isAuthEndpoint =
      config?.url?.includes("/auth/login") ||
      config?.url?.includes("/auth/register") ||
      config?.url?.includes("/auth/refresh") ||
      config?.url?.includes("/auth/verify-otp");

    if (response.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        }
      } catch {
        // fall through to sign-out below
      }
      notifyUnauthorized();
    }

    return Promise.reject(error);
  }
);

/** Attempts a silent refresh on app boot (e.g. after a page reload). */
export async function trySilentRefresh() {
  try {
    return await refreshAccessToken();
  } catch {
    clearAccessToken();
    return null;
  }
}

/** Extracts a human-readable message from an API error response. */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.message).join(" ");
  }
  return data.message || fallback;
}

export default api;
