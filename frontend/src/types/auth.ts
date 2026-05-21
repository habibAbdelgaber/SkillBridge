export type UserRole = "customer" | "provider" | "admin";

export type BusinessType =
  | "individual"
  | "llc"
  | "corporation"
  | "partnership"
  | "nonprofit"
  | "other";

export interface ProviderProfile {
  id: string;
  business_name: string;
  business_type: BusinessType;
  tax_id: string;
  phone_number: string;
  service_category: string;
  years_of_experience: number;
  service_area: string;
  short_bio: string;
  license_or_certification_number: string;
  insurance_provider: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  provider_profile: ProviderProfile | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CustomerRegisterPayload {
  email: string;
  password1: string;
  password2: string;
  first_name: string;
  last_name: string;
}

export interface ProviderRegisterPayload extends CustomerRegisterPayload {
  business_name: string;
  business_type: BusinessType;
  tax_id?: string;
  phone_number: string;
  service_category: string;
  years_of_experience: number;
  service_area: string;
  short_bio?: string;
  license_or_certification_number?: string;
  insurance_provider?: string;
}

/** dj-rest-auth JWT response: {access, refresh, user}. */
export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export type RegisterResponse = LoginResponse | { detail: string };

export function isLoginResponse(response: RegisterResponse): response is LoginResponse {
  return typeof (response as LoginResponse).access === "string";
}
