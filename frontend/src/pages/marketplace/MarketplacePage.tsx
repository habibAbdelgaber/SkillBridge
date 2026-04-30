import { useEffect, useState } from "react";

import { CategoryChips } from "@/components/marketplace/CategoryChips";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { MarketplaceSearchBar } from "@/components/marketplace/MarketplaceSearchBar";
import { ProviderCard } from "@/components/marketplace/ProviderCard";
import { SortDropdown } from "@/components/marketplace/SortDropdown";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Section } from "@/components/ui/Section";
import { useServices } from "@/hooks/useServices";
import {
  DEFAULT_PAGE_SIZE,
  marketplaceService,
} from "@/services/marketplaceService";
import type { Category, MarketplaceFilters } from "@/types/marketplace";
import { EMPTY_FILTERS } from "@/types/marketplace";

/**
 * Marketplace listing page.
 *
 * Layout: full-bleed header band with breadcrumb / title / search, then a
 * two-column body — sidebar filters on the left (>=lg), card grid on the
 * right. Mobile collapses to a stacked layout with a "Show filters"
 * toggle so the controls don't dominate small viewports.
 */
export function MarketplacePage() {
  const [filters, setFilters] = useState<MarketplaceFilters>(EMPTY_FILTERS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const {
    data: listings,
    totalCount,
    totalPages,
    isLoading,
    error,
    refetch,
  } = useServices(filters, { page, pageSize: DEFAULT_PAGE_SIZE });

  useEffect(() => {
    let cancelled = false;
    marketplaceService.listCategories().then((result) => {
      if (!cancelled) setCategories(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Whenever any filter changes, snap back to page 1 so the user isn't
  // stuck on a now-invalid page index (e.g. page 4 of a result set that
  // just shrunk to two pages after applying a category narrow).
  const filterFingerprint = JSON.stringify({
    ...filters,
    verifications: [...filters.verifications].sort(),
  });
  useEffect(() => {
    setPage(1);
  }, [filterFingerprint]);

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  const hasActiveFilters =
    filters.query.length > 0 ||
    filters.categorySlug !== null ||
    filters.availability !== null ||
    filters.rating !== null ||
    filters.price !== null ||
    filters.verifications.length > 0;

  const goToPage = (next: number) => {
    setPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <Section
        tone="default"
        className="relative overflow-hidden bg-gradient-to-bl from-brand-logo via-brand-primaryHover to-brand-primary text-white"
        innerClassName="relative mx-auto w-full max-w-6xl px-6 pt-10 pb-6 sm:pt-14"
      >
        {/* Decorative bubbles. Pointer-events disabled so they never
            intercept clicks on the search input or the chip rail. Static —
            no animation per the design brief — but a subtle blur keeps
            them from flattening against the gradient. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <span className="absolute right-1/3 top-10 h-40 w-40 rounded-full bg-sky-300/25 blur-2xl" />
          <span className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-primary/40 blur-3xl" />
          <span className="absolute bottom-6 left-1/3 h-24 w-24 rounded-full bg-white/15 blur-xl" />
        </div>

        <Breadcrumb
          tone="light"
          items={[{ label: "Home", to: "/" }, { label: "Marketplace" }]}
        />

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Services in Tel Aviv
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Browse {totalCount.toLocaleString()} verified professionals across{" "}
              {Math.max(0, categories.length - 1)} categories. Filter by
              availability, rating, and price to find the right match.
            </p>
          </div>

          <SortDropdown
            value={filters.sort}
            onChange={(sort) => setFilters((prev) => ({ ...prev, sort }))}
          />
        </div>

        {/* Search + categories share one row on >=md. Search shrinks to
            whatever space the category chips don't claim (clamped by a
            min width so the input stays usable), and the chip rail
            wraps to multiple lines instead of scrolling so every
            category is visible without truncation. */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
          <div className="md:min-w-[240px] md:max-w-md md:flex-1 md:shrink">
            <MarketplaceSearchBar
              value={filters.query}
              onChange={(query) => setFilters((prev) => ({ ...prev, query }))}
            />
          </div>

          {categories.length > 0 && (
            <div className="min-w-0 md:flex-[2_1_0%] md:self-center">
              <CategoryChips
                categories={categories}
                active={filters.categorySlug}
                onChange={(slug) =>
                  setFilters((prev) => ({ ...prev, categorySlug: slug }))
                }
              />
            </div>
          )}
        </div>
      </Section>

      <Section tone="surface" innerClassName="mx-auto w-full max-w-6xl px-6 pb-16 pt-2">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex w-full items-center justify-between rounded-xl border border-brand-borderLight bg-white px-4 py-2.5 text-sm font-medium text-brand-logo shadow-sm lg:hidden"
              aria-expanded={showFilters}
            >
              <span>{showFilters ? "Hide filters" : "Show filters"}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
              </svg>
            </button>
            <div className={showFilters ? "mt-3 lg:mt-0" : "hidden lg:block"}>
              <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} />
            </div>
          </div>

          <div>
            {isLoading ? (
              <LoadingState
                variant="card-grid"
                count={DEFAULT_PAGE_SIZE}
                label="Loading services…"
              />
            ) : error ? (
              <ErrorState
                title="Couldn't load services"
                description={error.message}
                onRetry={refetch}
              />
            ) : listings.length === 0 ? (
              <EmptyState
                title="No services match your filters"
                description={
                  hasActiveFilters
                    ? "Try widening the search or removing a filter."
                    : "We're rolling out coverage in your area soon."
                }
                action={
                  hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn-primary"
                    >
                      Clear filters
                    </button>
                  )
                }
              />
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing) => (
                    <ProviderCard key={listing.id} listing={listing} />
                  ))}
                </div>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={goToPage}
                />
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
