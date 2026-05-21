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
  average: number;
  count: number;
}

export interface ProviderSummary {
  id: string;
  fullName: string;
  initials: string;
  headline: string;
  location: string;
  yearsOnPlatform: number;
  jobsCompleted: number;
  rating: RatingSummary;
  verifications: VerificationFlag[];
  bio?: string;
  responseTimeMinutes?: number;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  category: Category;
  title: string;
  subtitle?: string;
  pricePerHour?: number;
  flatPrice?: number;
  rating: RatingSummary;
  locationType: ServiceLocationType;
  serviceLocationName?: string;
  serviceAddress?: string;
  serviceCity?: string;
  serviceCountry?: string;
  latitude?: number;
  longitude?: number;
  serviceArea: string;
  imageUrl?: string;
  isFeatured: boolean;
  /** Placeholder until service-level availability exists in the API. */
  availability: AvailabilityWindow[];
  durationMinutes: number;
}

export interface AvailabilityDay {
  date: string;
  weekdayShort: string;
  dayOfMonth: string;
  slots: string[];
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  postedAgo: string;
  body: string;
}

export interface ProviderDetail extends ProviderSummary {
  bio: string;
  servicesOffered: ServiceListing[];
  reviews: Review[];
  availability: AvailabilityDay[];
}

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
