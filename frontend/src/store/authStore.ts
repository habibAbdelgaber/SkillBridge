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
  | "unauthenticated"
  | "error";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  isHydrating: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  registerCustomer: (payload: CustomerRegisterPayload) => Promise<RegisterResponse>;
  registerProvider: (payload: ProviderRegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

function applyLoginResponse(response: LoginResponse): AuthUser {
  authStorage.setTokens({
    access: response.access_token,
    refresh: response.refresh_token,
  });
  authStorage.setUser(response.user);
  return response.user;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: authStorage.getUser(),
  status: authStorage.getTokens() ? "authenticated" : "idle",
  isHydrating: false,
  error: null,

  async hydrate() {
    const tokens = authStorage.getTokens();
    if (!tokens) {
      set({ status: "unauthenticated", isHydrating: false });
      return;
    }
    set({ isHydrating: true });
    try {
      const user = await authService.currentUser();
      authStorage.setUser(user);
      set({ user, status: "authenticated", isHydrating: false, error: null });
    } catch {
      // Refresh interceptor will have already cleared storage on a hard 401.
      set({ user: null, status: "unauthenticated", isHydrating: false });
    }
  },

  async login(payload) {
    set({ status: "authenticating", error: null });
    try {
      const response = await authService.login(payload);
      const user = applyLoginResponse(response);
      set({ user, status: "authenticated", error: null });
    } catch (err) {
      set({ status: "error", error: (err as Error).message });
      throw err;
    }
  },

  async registerCustomer(payload) {
    set({ status: "authenticating", error: null });
    try {
      const response = await authService.registerCustomer(payload);
      if (isLoginResponse(response)) {
        const user = applyLoginResponse(response);
        set({ user, status: "authenticated" });
      } else {
        set({ status: "unauthenticated" });
      }
      return response;
    } catch (err) {
      set({ status: "error", error: (err as Error).message });
      throw err;
    }
  },

  async registerProvider(payload) {
    set({ status: "authenticating", error: null });
    try {
      const response = await authService.registerProvider(payload);
      if (isLoginResponse(response)) {
        const user = applyLoginResponse(response);
        set({ user, status: "authenticated" });
      } else {
        set({ status: "unauthenticated" });
      }
      return response;
    } catch (err) {
      set({ status: "error", error: (err as Error).message });
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
      // Logout is best-effort; we always clear local state.
    } finally {
      get().clearSession();
    }
  },

  clearSession() {
    authStorage.clear();
    set({ user: null, status: "unauthenticated", error: null });
  },
}));

// When a refresh definitively fails, drop the session so guards re-route to /login.
onSessionExpired(() => {
  useAuthStore.getState().clearSession();
});

// ---- Selectors ------------------------------------------------------------

export const selectIsAuthenticated = (s: AuthState): boolean =>
  s.status === "authenticated" && s.user !== null;
