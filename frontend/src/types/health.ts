export interface HealthStatus {
  status: "ok" | "degraded";
  service: string;
  debug: boolean;
  timestamp: string;
  database: "ok" | "unreachable";
}
