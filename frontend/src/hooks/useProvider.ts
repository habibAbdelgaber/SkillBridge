import { useEffect, useRef, useState } from "react";

import { marketplaceService } from "@/services/marketplaceService";
import type { ProviderDetail } from "@/types/marketplace";

interface UseProviderResult {
  data: ProviderDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProvider(providerId: string | undefined): UseProviderResult {
  const [data, setData] = useState<ProviderDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(providerId));
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState<number>(0);
  const requestId = useRef<number>(0);

  useEffect(() => {
    if (!providerId) {
      setData(null);
      setIsLoading(false);
      setError(new Error("Provider id missing in URL."));
      return;
    }

    const id = ++requestId.current;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    marketplaceService
      .getProvider(providerId)
      .then((result) => {
        if (cancelled || id !== requestId.current) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled || id !== requestId.current) return;
        setError(err instanceof Error ? err : new Error("Failed to load provider."));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [providerId, version]);

  return {
    data,
    isLoading,
    error,
    refetch: () => setVersion((v) => v + 1),
  };
}
