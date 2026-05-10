/** Marketplace API layer. */
import { isAxiosError } from "axios";

import { apiClient } from "@/services/apiClient";
import {
  type ApiPaginated,
  type ApiProviderDetail,
  mapCategory,
  mapProviderDetail,
  mapServicePublic,
} from "@/services/marketplaceMappers";
import type {
  Category,
  MarketplaceFilters,
  ProviderDetail,
  ServiceListing,
  SortOption,
} from "@/types/marketplace";

const ENDPOINTS = {
  categories: "/api/v1/categories/",
  services: "/api/v1/services/",
  service: (id: string) => `/api/v1/services/${id}/`,
  provider: (id: string) => `/api/v1/providers/${id}/`,
  providerAvailability: (id: string) => `/api/v1/providers/${id}/availability/`,
} as const;

export const DEFAULT_PAGE_SIZE = 6;

export interface ServiceListPage {
  items: ServiceListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Map supported sort options onto DRF's ordering query param. */
function backendOrderingFor(sort: SortOption): string | null {
  switch (sort) {
    case "price-low":
      return "price";
    case "price-high":
      return "-price";
    case "best-rated":
    case "most-reviewed":
      return null;
    default:
      return null;
  }
}

function compareForClientSort(
  a: ServiceListing,
  b: ServiceListing,
  sort: SortOption,
): number {
  switch (sort) {
    case "best-rated":
      return b.rating.average - a.rating.average;
    case "most-reviewed":
      return b.rating.count - a.rating.count;
    case "price-low":
      return priceForFilter(a) - priceForFilter(b);
    case "price-high":
      return priceForFilter(b) - priceForFilter(a);
    default:
      return 0;
  }
}

function priceForFilter(listing: ServiceListing): number {
  return listing.pricePerHour ?? listing.flatPrice ?? 0;
}

function passesClientFilters(
  listing: ServiceListing,
  filters: MarketplaceFilters,
): boolean {
  if (filters.rating != null && filters.rating !== 0) {
    if (listing.rating.average < filters.rating) return false;
  }

  if (filters.price) {
    const price = priceForFilter(listing);
    if (filters.price === "under-50" && price >= 50) return false;
    if (filters.price === "50-100" && (price < 50 || price > 100)) return false;
    if (filters.price === "100-plus" && price <= 100) return false;
  }

  // Availability and verification filters need provider data.
  return true;
}

function describeAxiosError(error: unknown, fallback: string): Error {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) {
      return new Error("Not found.");
    }
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (detail) return new Error(detail);
    if (error.response?.status) {
      return new Error(`${fallback} (HTTP ${error.response.status})`);
    }
    return new Error(error.message || fallback);
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export const marketplaceService = {
  async listCategories(): Promise<Category[]> {
    try {
      const { data } = await apiClient.get<
        ApiPaginated<Parameters<typeof mapCategory>[0]>
      >(ENDPOINTS.categories, { params: { page_size: 100, ordering: "name" } });
      const rows = data.results ?? [];
      const mapped = rows.filter((c) => c.is_active).map(mapCategory);
      // Synthetic default chip that clears the category filter.
      return [{ slug: "all", label: "All" }, ...mapped];
    } catch (error) {
      throw describeAxiosError(error, "Failed to load categories.");
    }
  },

  async listServices(
    filters: MarketplaceFilters,
    pagination: { page?: number; pageSize?: number } = {},
  ): Promise<ServiceListPage> {
    const page = Math.max(1, pagination.page ?? 1);
    const pageSize = Math.max(1, pagination.pageSize ?? DEFAULT_PAGE_SIZE);
    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };
    if (filters.query) params.search = filters.query;
    if (filters.categorySlug && filters.categorySlug !== "all") {
      params.category = filters.categorySlug;
    }
    const ordering = backendOrderingFor(filters.sort);
    if (ordering) params.ordering = ordering;

    try {
      const { data } = await apiClient.get<
        ApiPaginated<Parameters<typeof mapServicePublic>[0]>
      >(ENDPOINTS.services, { params });
      const mapped = (data.results ?? []).map(mapServicePublic);
      const filteredItems = mapped.filter((listing) =>
        passesClientFilters(listing, filters),
      );
      // Rating sorts are client-side until the API supports them.
      filteredItems.sort((a, b) => compareForClientSort(a, b, filters.sort));
      const totalCount = data.count ?? filteredItems.length;
      return {
        items: filteredItems,
        totalCount,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      };
    } catch (error) {
      throw describeAxiosError(error, "Failed to load services.");
    }
  },

  async getProvider(providerId: string): Promise<ProviderDetail> {
    try {
      const { data } = await apiClient.get<ApiProviderDetail>(
        ENDPOINTS.provider(providerId),
      );
      return mapProviderDetail(data);
    } catch (error) {
      throw describeAxiosError(error, "Failed to load provider.");
    }
  },

  async getService(serviceId: string): Promise<ServiceListing> {
    try {
      const { data } = await apiClient.get<Parameters<typeof mapServicePublic>[0]>(
        ENDPOINTS.service(serviceId),
      );
      return mapServicePublic(data);
    } catch (error) {
      throw describeAxiosError(error, "Failed to load service.");
    }
  },

  async getProviderAvailability(
    providerId: string,
    range: { from: string; to: string },
  ): Promise<
    Array<{
      date: string;
      weekday: number;
      slots: Array<{ start_time: string; end_time: string }>;
    }>
  > {
    try {
      const { data } = await apiClient.get<
        Array<{
          date: string;
          weekday: number;
          slots: Array<{ start_time: string; end_time: string }>;
        }>
      >(ENDPOINTS.providerAvailability(providerId), {
        params: { from: range.from, to: range.to },
      });
      return data;
    } catch (error) {
      throw describeAxiosError(error, "Failed to load availability.");
    }
  },
};
