/**
 * Marketplace API layer.
 *
 * Talks to the public Django endpoints:
 *   GET /api/v1/categories/             — categories list
 *   GET /api/v1/services/               — service marketplace listings
 *   GET /api/v1/providers/{id}/         — provider profile (with services + reviews)
 *
 * The endpoints are paginated (DRF ``PageNumberPagination``, page size 20);
 * this layer unwraps ``results`` and exposes a flat array. Pagination can be
 * lifted into the call signature when the SPA grows infinite scroll.
 *
 * Filters not natively supported by the service viewset (rating floor,
 * price bucket, availability window, verification flags) are applied
 * client-side after fetching the first page. This keeps the surface area
 * stable while the backend catches up — the only client-visible cost is
 * that filtered counts are best-effort within a single page.
 */
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

// ---------------------------------------------------------------------------
// Endpoint paths
// ---------------------------------------------------------------------------

const ENDPOINTS = {
  categories: "/api/v1/categories/",
  services: "/api/v1/services/",
  provider: (id: string) => `/api/v1/providers/${id}/`,
} as const;

/** Default cards-per-page on the marketplace listing grid. */
export const DEFAULT_PAGE_SIZE = 6;

/**
 * Paginated services response.
 *
 * `items` is the (filtered + sorted) page payload; the metadata fields
 * mirror DRF's pagination envelope so the SPA can render a "Page X of Y"
 * pager without re-deriving the math.
 */
export interface ServiceListPage {
  items: ServiceListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Sort + filter translation
// ---------------------------------------------------------------------------

/**
 * Map the SPA's sort options onto DRF's ``ordering`` query param.
 *
 * The service viewset only exposes ordering on ``created_at``, ``price``,
 * and ``duration_minutes``. Rating-based sorts can't be pushed down, so
 * they fall back to a stable default ordering and are re-sorted client-
 * side after the response lands.
 */
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

  // ``availability`` and ``verifications`` aren't on the service payload
  // (they live on the provider). Once the service serializer joins those
  // fields they can move out of "always pass" and into a real check.
  return true;
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

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
      const { data } = await apiClient.get<ApiPaginated<Parameters<typeof mapCategory>[0]>>(
        ENDPOINTS.categories,
        { params: { page_size: 100, ordering: "name" } },
      );
      const rows = data.results ?? [];
      const mapped = rows.filter((c) => c.is_active).map(mapCategory);
      // Prepend a synthetic "All" entry so the chip rail always has a
      // default active state when no category filter is set. CategoryChips
      // treats `slug === "all"` as the null filter, so clicking it clears
      // the category narrow on the listing query.
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
      const { data } = await apiClient.get<ApiPaginated<Parameters<typeof mapServicePublic>[0]>>(
        ENDPOINTS.services,
        { params },
      );
      const mapped = (data.results ?? []).map(mapServicePublic);
      const filteredItems = mapped.filter((listing) =>
        passesClientFilters(listing, filters),
      );
      // Re-sort client-side for rating-based options the backend can't
      // push down; price ordering already came in correct so the
      // comparator is a no-op for those.
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
};
