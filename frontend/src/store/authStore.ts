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
  // dj-rest-auth returns {access, refresh, user}.
  authStorage.setTokens({
    access: response.access,
    refresh: response.refresh,
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
      // The refresh interceptor clears storage on a hard 401.
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

// Keep this hook here to avoid importing the store from apiClient.
onSessionExpired(() => {
  useAuthStore.getState().clearSession();
});

export const selectIsAuthenticated = (s: AuthState): boolean =>
  s.status === "authenticated" && s.user !== null;
