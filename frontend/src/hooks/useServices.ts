import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_PAGE_SIZE,
  marketplaceService,
  type ServiceListPage,
} from "@/services/marketplaceService";
import type { MarketplaceFilters, ServiceListing } from "@/types/marketplace";

interface UseServicesOptions {
  page?: number;
  pageSize?: number;
}

interface UseServicesResult {
  data: ServiceListing[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useServices(
  filters: MarketplaceFilters,
  options: UseServicesOptions = {},
): UseServicesResult {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const [pageResult, setPageResult] = useState<ServiceListPage>(() => ({
    items: [],
    totalCount: 0,
    page,
    pageSize,
    totalPages: 1,
  }));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState<number>(0);
  const requestId = useRef<number>(0);

  const key = JSON.stringify({
    ...filters,
    verifications: [...filters.verifications].sort(),
    page,
    pageSize,
  });

  useEffect(() => {
    const id = ++requestId.current;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    marketplaceService
      .listServices(filters, { page, pageSize })
      .then((result) => {
        if (cancelled || id !== requestId.current) return;
        setPageResult(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled || id !== requestId.current) return;
        setError(err instanceof Error ? err : new Error("Failed to load services."));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures filter equality.
  }, [key, version]);

  return {
    data: pageResult.items,
    totalCount: pageResult.totalCount,
    totalPages: pageResult.totalPages,
    page: pageResult.page,
    pageSize: pageResult.pageSize,
    isLoading,
    error,
    refetch: () => setVersion((v) => v + 1),
  };
}
