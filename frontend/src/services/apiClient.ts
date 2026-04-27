import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { appConfig } from "@/app/config";
import { authStorage } from "@/utils/authStorage";

/**
 * Shared Axios instance for every SkillBridge backend call.
 *
 * Responsibilities (single source of truth):
 *   - base URL + timeout + JSON headers
 *   - injecting the current access token into every outbound request
 *   - silently refreshing the access token on a 401 and retrying the request
 *   - surfacing a clean AxiosError to callers if refresh itself fails
 *
 * Service-layer modules (e.g. `authService.ts`) import `apiClient` and never
 * talk to `axios` directly, which keeps interceptor logic in one place.
 */

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Endpoints that must never trigger the refresh interceptor (they *are* the
 *  refresh flow, and looping into themselves would 401 forever). */
const REFRESH_EXEMPT_PATHS = [
  "/api/v1/auth/token/refresh/",
  "/api/v1/auth/login/",
  "/api/v1/auth/logout/",
];

function isExemptPath(url: string | undefined): boolean {
  if (!url) return false;
  return REFRESH_EXEMPT_PATHS.some((p) => url.includes(p));
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ---- Auth header injection -----------------------------------------------

apiClient.interceptors.request.use((config) => {
  const tokens = authStorage.getTokens();
  if (tokens?.access) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// ---- Session-expired hook -------------------------------------------------
//
// authStore subscribes to this so it can clear local state and route the
// user to /login when refresh definitively fails. Kept as a setter to avoid
// a circular import between apiClient and authStore.
type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function onSessionExpired(handler: SessionExpiredHandler): void {
  sessionExpiredHandler = handler;
}

// ---- Refresh interceptor --------------------------------------------------
//
// Single in-flight refresh promise so a burst of parallel 401s does not
// trigger N refresh requests. All concurrent failures await the same
// promise and replay their original requests once it resolves.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = authStorage.getTokens();
  if (!tokens?.refresh) return null;

  try {
    const { data } = await axios.post<{ access: string }>(
      `${appConfig.apiUrl}/api/v1/auth/token/refresh/`,
      { refresh: tokens.refresh },
      { headers: { "Content-Type": "application/json" } },
    );
    authStorage.setTokens({ access: data.access, refresh: tokens.refresh });
    return data.access;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    if (isExemptPath(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    const newAccess = await refreshInFlight;

    if (!newAccess) {
      authStorage.clear();
      sessionExpiredHandler?.();
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
    return apiClient.request(original as AxiosRequestConfig);
  },
);
