/**
 * Centralized runtime configuration, sourced from Vite environment variables.
 *
 * All `VITE_*` values must be declared here so that the rest of the app
 * never reads `import.meta.env` directly.
 */
interface AppConfig {
  apiUrl: string;
  environment: "development" | "production" | "test";
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const appConfig: AppConfig = {
  apiUrl: apiUrl.replace(/\/+$/, ""),
  environment: (import.meta.env.MODE as AppConfig["environment"]) ?? "development",
};
