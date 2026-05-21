import axios from "axios";

export interface NormalizedApiError {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
}

const GENERIC_FALLBACK = "Something went wrong. Please try again.";
const NETWORK_FALLBACK =
  "We couldn't reach the SkillBridge server. Check your connection and try again.";

function readableStringError(data: string, status: number): string {
  const text = data.trim();
  if (!text) return `${GENERIC_FALLBACK} (HTTP ${status})`;

  const message = text.match(/<Message>([\s\S]*?)<\/Message>/i)?.[1];
  if (message) {
    return message
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }

  if (text.startsWith("<")) {
    return `${GENERIC_FALLBACK} (HTTP ${status})`;
  }

  return text;
}

/** Normalize Axios/DRF errors into a form-friendly shape. */
export function parseApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError(error)) {
    return { message: GENERIC_FALLBACK, fieldErrors: {} };
  }

  if (!error.response) {
    return { message: NETWORK_FALLBACK, fieldErrors: {} };
  }

  const status = error.response.status;
  const data = error.response.data;

  if (!data || typeof data !== "object") {
    return {
      message:
        typeof data === "string" && data.trim()
          ? readableStringError(data, status)
          : `${GENERIC_FALLBACK} (HTTP ${status})`,
      fieldErrors: {},
      status,
    };
  }

  const payload = data as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  let bannerMessage: string | undefined;

  if (typeof payload.detail === "string") {
    bannerMessage = payload.detail;
  }

  if (Array.isArray(payload.non_field_errors)) {
    bannerMessage = payload.non_field_errors.map(String).join(" ");
  }

  for (const [key, value] of Object.entries(payload)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(value)) {
      fieldErrors[key] = value.map(String).join(" ");
    } else if (typeof value === "string") {
      fieldErrors[key] = value;
    }
  }

  const message =
    bannerMessage ??
    (Object.keys(fieldErrors).length > 0
      ? "Please fix the highlighted fields and try again."
      : `${GENERIC_FALLBACK} (HTTP ${status})`);

  return { message, fieldErrors, status };
}
