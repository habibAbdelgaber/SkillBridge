import { create } from "zustand";

/**
 * Authentication store placeholder.
 *
 * Stage-1 only exposes shape + no-op actions. Real auth (JWT storage,
 * refresh flow, user hydration) is wired in stage-2.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (payload: { user: AuthUser; token: string }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setSession: ({ user, token }) =>
    set({ user, token, isAuthenticated: true }),
  clearSession: () => set({ user: null, token: null, isAuthenticated: false }),
}));
