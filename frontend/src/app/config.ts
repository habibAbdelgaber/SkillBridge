/** Runtime configuration sourced from Vite environment variables. */
interface AppConfig {
  apiUrl: string;
  googleMapsApiKey: string;
  hasGoogleMapsApiKey: boolean;
  environment: "development" | "production" | "test";
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const googleMapsApiKey = normalizeGoogleMapsApiKey(
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
);

export const appConfig: AppConfig = {
  apiUrl: apiUrl.replace(/\/+$/, ""),
  googleMapsApiKey,
  hasGoogleMapsApiKey: Boolean(googleMapsApiKey),
  environment: (import.meta.env.MODE as AppConfig["environment"]) ?? "development",
};

function normalizeGoogleMapsApiKey(value: unknown): string {
  if (typeof value !== "string") return "";

  const key = value.trim();
  const lower = key.toLowerCase();
  const placeholders = [
    "",
    "<browser-restricted google maps key>",
    "<google maps api key>",
    "your-google-maps-api-key",
    "your_google_maps_api_key",
    "google-maps-api-key",
  ];

  if (placeholders.includes(lower)) return "";
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(key) ? key : "";
}
