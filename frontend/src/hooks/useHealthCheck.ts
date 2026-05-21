import { useCallback, useEffect, useState } from "react";

import { fetchHealth } from "@/services/healthService";
import type { HealthStatus } from "@/types/health";

type Status = "idle" | "loading" | "success" | "error";

interface UseHealthCheckResult {
  status: Status;
  data: HealthStatus | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHealthCheck(): UseHealthCheckResult {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fetchHealth();
      setData(result);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, data, error, refresh };
}
