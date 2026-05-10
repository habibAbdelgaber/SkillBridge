/** Runtime configuration sourced from Vite environment variables. */
interface AppConfig {
  apiUrl: string;
  googleMapsApiKey: string;
  environment: "development" | "production" | "test";
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const appConfig: AppConfig = {
  apiUrl: apiUrl.replace(/\/+$/, ""),
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  environment: (import.meta.env.MODE as AppConfig["environment"]) ?? "development",
};
