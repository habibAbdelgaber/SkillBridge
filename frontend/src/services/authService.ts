import { apiClient } from "@/services/apiClient";
import type {
  AuthUser,
  CustomerRegisterPayload,
  LoginPayload,
  LoginResponse,
  ProviderRegisterPayload,
  RegisterResponse,
} from "@/types/auth";

const BASE = "/api/v1/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(`${BASE}/login/`, payload);
    return data;
  },

  async registerCustomer(payload: CustomerRegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>(
      `${BASE}/register/`,
      payload,
    );
    return data;
  },

  async registerProvider(payload: ProviderRegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>(
      `${BASE}/register/provider/`,
      payload,
    );
    return data;
  },

  async currentUser(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>(`${BASE}/user/`);
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post(`${BASE}/logout/`, { refresh: refreshToken });
  },

  async requestPasswordReset(email: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `${BASE}/password/reset/`,
      { email },
    );
    return data;
  },

  async confirmPasswordReset(payload: {
    uid: string;
    token: string;
    new_password1: string;
    new_password2: string;
  }): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `${BASE}/password/reset/confirm/`,
      payload,
    );
    return data;
  },

  async verifyEmail(key: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `${BASE}/register/verify-email/`,
      { key },
    );
    return data;
  },

  async resendVerificationEmail(email: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `${BASE}/register/resend-email/`,
      { email },
    );
    return data;
  },
};
