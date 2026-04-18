import axios, { AxiosError, type AxiosInstance } from "axios";

import { appConfig } from "@/app/config";

/**
 * Shared Axios instance for all backend calls.
 *
 * Keeping a single instance lets us attach interceptors in one place
 * (auth headers, error normalization, logging) once stage-2 introduces
 * authentication.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // Placeholder for auth header injection in later stages.
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      // Keep this quiet in production; verbose during local dev.
      // eslint-disable-next-line no-console
      console.error("[apiClient]", error.message, error.response?.data);
    }
    return Promise.reject(error);
  },
);
