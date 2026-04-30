/**
 * Marketplace-domain types.
 *
 * Mirrors the JSON shapes returned by the Django marketplace endpoints
 * (``/api/v1/services/``, ``/api/v1/providers/``, ``/api/v1/categories/``)
 * after they pass through ``services/marketplaceMappers.ts``. The mapper
 * is the only translator: components and hooks consume these shapes and
 * stay decoupled from snake_case wire names.
 *
 * Fields the backend hasn't shipped yet (per-service availability windows
 * and the provider's 7-day booking grid) are still declared here so the
 * SPA can render them when the backend catches up; mappers fill them with
 * empty arrays in the meantime.
 */

export type ServiceLocationType = "remote" | "onsite" | "hybrid";

export type AvailabilityWindow = "today" | "this-week" | "next-week";

export type RatingFloor = 4.5 | 4.0 | 0;

export type PriceBucket = "under-50" | "50-100" | "100-plus";

export type VerificationFlag = "id" | "insured" | "background";

export type SortOption = "best-rated" | "most-reviewed" | "price-low" | "price-high";

export interface Category {
  slug: string;
  label: string;
}

export interface RatingSummary {
  /** 0–5, one decimal. */
  average: number;
  /** Total review count. */
  count: number;
}

export interface ProviderSummary {
  id: string;
  fullName: string;
  /** Two-letter avatar fallback. Computed from fullName when missing. */
  initials: string;
  headline: string;
  location: string;
  yearsOnPlatform: number;
  jobsCompleted: number;
  rating: RatingSummary;
  /** Trust badges shown in the hero / cards. */
  verifications: VerificationFlag[];
  /** Backend-derived; null until the user opens the profile. */
  bio?: string;
  /** Average response time in minutes; rendered as "Replies in under N hour(s)". */
  responseTimeMinutes?: number;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  category: Category;
  /** "Emergency pipe repair", etc. */
  title: string;
  /** Sub-line under the title (optional). */
  subtitle?: string;
  /** Hourly rate in whole dollars; rendered with `PriceBadge`. */
  pricePerHour?: number;
  /** Flat price for one-shot jobs (mutually-exclusive with pricePerHour in display). */
  flatPrice?: number;
  rating: RatingSummary;
  locationType: ServiceLocationType;
  /** City / region the service is offered in. */
  serviceArea: string;
  /** Optional banner image URL; falls back to a tinted placeholder. */
  imageUrl?: string;
  isFeatured: boolean;
  /** First availability slot; populated by the backend in a later iteration. */
  availability: AvailabilityWindow[];
}

export interface AvailabilityDay {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** "Mon" / "Tue" etc. Pre-computed so locale logic stays out of the view. */
  weekdayShort: string;
  /** "17", "18", … the day of the month. */
  dayOfMonth: string;
  /** HH:MM strings; empty when fully booked. */
  slots: string[];
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  /** "2 days ago", "1 week ago" etc. Pre-formatted on the server side. */
  postedAgo: string;
  body: string;
}

export interface ProviderDetail extends ProviderSummary {
  bio: string;
  servicesOffered: ServiceListing[];
  reviews: Review[];
  availability: AvailabilityDay[];
}

// ---- Filter shape used by the marketplace list view ----------------------


export interface MarketplaceFilters {
  query: string;
  categorySlug: string | null;
  availability: AvailabilityWindow | null;
  rating: RatingFloor | null;
  price: PriceBucket | null;
  verifications: VerificationFlag[];
  sort: SortOption;
}

export const EMPTY_FILTERS: MarketplaceFilters = {
  query: "",
  categorySlug: null,
  availability: null,
  rating: null,
  price: null,
  verifications: [],
  sort: "best-rated",
};
