import type { AuthTokens, AuthUser } from "@/types/auth";

const TOKENS_KEY = "skillbridge.auth.tokens.v1";
const USER_KEY = "skillbridge.auth.user.v1";

function safeGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export const authStorage = {
  getTokens: (): AuthTokens | null => safeGet<AuthTokens>(TOKENS_KEY),
  setTokens: (tokens: AuthTokens): void => safeSet(TOKENS_KEY, tokens),
  getUser: (): AuthUser | null => safeGet<AuthUser>(USER_KEY),
  setUser: (user: AuthUser): void => safeSet(USER_KEY, user),
  clear: (): void => {
    safeRemove(TOKENS_KEY);
    safeRemove(USER_KEY);
  },
};
