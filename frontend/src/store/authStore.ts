import { create } from "zustand";

import { authService } from "@/services/authService";
import { onSessionExpired } from "@/services/apiClient";
import type {
  AuthUser,
  CustomerRegisterPayload,
  LoginPayload,
  LoginResponse,
  ProviderRegisterPayload,
  RegisterResponse,
} from "@/types/auth";
import { isLoginResponse } from "@/types/auth";
import { authStorage } from "@/utils/authStorage";

/**
 * Auth store.
 *
 * Responsible for the authenticated user's session: JWT storage via
 * `authStorage`, the Zustand-facing React state, and the primary
 * actions the UI needs (login, register, hydrate, logout).
 *
 * Networking stays in `services/authService.ts`; this store orchestrates
 * those calls and keeps the observable state consistent.
 */

export type AuthStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  /** True while a pre-mount hydration call is in flight. */
  isHydrating: boolean;

  // Actions
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  registerCustomer: (
    payload: CustomerRegisterPayload,
  ) => Promise<RegisterResponse>;
  registerProvider: (
    payload: ProviderRegisterPayload,
  ) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

function commitSession(response: LoginResponse): AuthUser {
  authStorage.setTokens({
    access: response.access_token,
    refresh: response.refresh_token,
  });
  authStorage.setUser(response.user);
  return response.user;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: authStorage.getUser(),
  status: authStorage.getTokens() ? "authenticated" : "unauthenticated",
  isHydrating: false,

  async hydrate() {
    const tokens = authStorage.getTokens();
    if (!tokens) {
      set({ user: null, status: "unauthenticated", isHydrating: false });
      return;
    }
    set({ isHydrating: true });
    try {
      const user = await authService.currentUser();
      authStorage.setUser(user);
      set({ user, status: "authenticated", isHydrating: false });
    } catch {
      // Either tokens are invalid or the backend is unreachable. The Axios
      // refresh interceptor will have already cleared storage on a hard 401.
      authStorage.clear();
      set({ user: null, status: "unauthenticated", isHydrating: false });
    }
  },

  async login(payload) {
    set({ status: "authenticating" });
    try {
      const response = await authService.login(payload);
      const user = commitSession(response);
      set({ user, status: "authenticated" });
      return response;
    } catch (err) {
      set({ status: "unauthenticated" });
      throw err;
    }
  },

  async registerCustomer(payload) {
    set({ status: "authenticating" });
    try {
      const response = await authService.registerCustomer(payload);
      if (isLoginResponse(response)) {
        const user = commitSession(response);
        set({ user, status: "authenticated" });
      } else {
        set({ status: "unauthenticated" });
      }
      return response;
    } catch (err) {
      set({ status: "unauthenticated" });
      throw err;
    }
  },

  async registerProvider(payload) {
    set({ status: "authenticating" });
    try {
      const response = await authService.registerProvider(payload);
      if (isLoginResponse(response)) {
        const user = commitSession(response);
        set({ user, status: "authenticated" });
      } else {
        set({ status: "unauthenticated" });
      }
      return response;
    } catch (err) {
      set({ status: "unauthenticated" });
      throw err;
    }
  },

  async logout() {
    const tokens = authStorage.getTokens();
    try {
      if (tokens?.refresh) {
        await authService.logout(tokens.refresh);
      }
    } catch {
      /* swallow — always clear local state */
    }
    get().clearSession();
  },

  clearSession() {
    authStorage.clear();
    set({ user: null, status: "unauthenticated" });
  },
}));

// Wire the api client's session-expired broadcast into the store so a failed
// refresh (e.g. blacklisted refresh token) hard-logs-out the UI.
onSessionExpired(() => {
  useAuthStore.getState().clearSession();
});

// Convenience selectors.
export const selectIsAuthenticated = (s: AuthState): boolean =>
  s.status === "authenticated" && s.user !== null;
