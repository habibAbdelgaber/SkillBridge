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
  "/api/v1/auth/register/",
  "/api/v1/auth/register/provider/",
  "/api/v1/auth/logout/",
];

/** Callbacks invoked when a global logout is forced after a failed refresh. */
type SessionExpiredHandler = () => void;
const sessionExpiredHandlers = new Set<SessionExpiredHandler>();
export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
}
function broadcastSessionExpired(): void {
  authStorage.clear();
  sessionExpiredHandlers.forEach((fn) => fn());
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ---- Request interceptor: inject bearer token -----------------------------
apiClient.interceptors.request.use((config) => {
  const tokens = authStorage.getTokens();
  if (tokens?.access && config.headers) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// ---- Response interceptor: refresh on 401 ---------------------------------
// A single in-flight refresh promise is shared so parallel requests that all
// fail on 401 don't each spawn a new refresh call.
let inflightRefresh: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const tokens = authStorage.getTokens();
  if (!tokens?.refresh) {
    throw new Error("No refresh token available");
  }
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${appConfig.apiUrl}/api/v1/auth/token/refresh/`,
    { refresh: tokens.refresh },
    { headers: { "Content-Type": "application/json" } },
  );
  const nextTokens = {
    access: data.access,
    // SIMPLE_JWT.ROTATE_REFRESH_TOKENS=True means a new refresh is returned.
    refresh: data.refresh ?? tokens.refresh,
  };
  authStorage.setTokens(nextTokens);
  return nextTokens.access;
}

function isRefreshExempt(config: AxiosRequestConfig | undefined): boolean {
  if (!config?.url) return false;
  return REFRESH_EXEMPT_PATHS.some((p) => config.url!.includes(p));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isRefreshExempt(original)
    ) {
      original._retry = true;

      try {
        inflightRefresh = inflightRefresh ?? refreshAccessToken();
        const access = await inflightRefresh;
        inflightRefresh = null;

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${access}`;
        return apiClient.request(original);
      } catch (refreshErr) {
        inflightRefresh = null;
        broadcastSessionExpired();
        return Promise.reject(refreshErr);
      }
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[apiClient]", error.message, error.response?.data);
    }
    return Promise.reject(error);
  },
);
