import { apiClient } from "@/services/apiClient";
import type { HealthStatus } from "@/types/health";

export async function fetchHealth(): Promise<HealthStatus> {
  const { data } = await apiClient.get<HealthStatus>("/health/");
  return data;
}
