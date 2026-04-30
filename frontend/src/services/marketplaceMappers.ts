/**
 * Pure transforms between the Django REST shapes and the marketplace
 * domain types the SPA renders against.
 *
 * Kept in a dedicated module so:
 *   - the service layer stays thin (just HTTP plus ``mapX(...)``)
 *   - mappers are independently unit-testable
 *   - tweaking one nested shape (e.g. switching ``service_area`` to a
 *     structured ``{city, region}``) lands here, not at the call sites.
 */
import type {
  AvailabilityWindow,
  Category,
  ProviderDetail,
  ProviderSummary,
  RatingSummary,
  Review,
  ServiceListing,
  ServiceLocationType,
  VerificationFlag,
} from "@/types/marketplace";

// ---------------------------------------------------------------------------
// Backend payload shapes (mirror DRF serializers, not exported)
// ---------------------------------------------------------------------------

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

interface ApiRating {
  average: number;
  count: number;
}

interface ApiProviderSummary {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  business_type: string;
  headline: string;
  service_category: string;
  years_of_experience: number;
  service_area: string;
  short_bio: string;
  response_time_minutes: number | null;
  is_verified: boolean;
  jobs_completed: number;
  rating: ApiRating;
  verifications: VerificationFlag[];
  created_at: string;
}

interface ApiServiceMini {
  id: string;
  category: ApiCategory;
  title: string;
  subtitle: string;
  slug: string;
  price: string;
  pricing_type: "hourly" | "flat";
  duration_minutes: number;
  location_type: ServiceLocationType;
  hero_image_url: string;
  is_featured: boolean;
  rating: ApiRating;
}

interface ApiServicePublic extends ApiServiceMini {
  provider: ApiProviderSummary;
  description: string;
  created_at: string;
}

interface ApiReview {
  id: string;
  service_id: string;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
}

export interface ApiProviderDetail extends ApiProviderSummary {
  services_offered: ApiServiceMini[];
  reviews: ApiReview[];
}

/** DRF PageNumberPagination response shape. */
export interface ApiPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Public mappers
// ---------------------------------------------------------------------------

export function mapCategory(api: ApiCategory): Category {
  return { slug: api.slug, label: api.name };
}

function initialsFor(name: string): string {
  // Two-letter monogram fallback used by the avatar tile when no image
  // upload has happened yet. Falls back to "?" rather than an empty
  // string so the markup never collapses.
  const parts = name
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function mapRating(api: ApiRating): RatingSummary {
  return {
    average: typeof api.average === "number" ? api.average : Number(api.average) || 0,
    count: typeof api.count === "number" ? api.count : Number(api.count) || 0,
  };
}

export function mapProviderSummary(api: ApiProviderSummary): ProviderSummary {
  const fullName = api.full_name?.trim() || api.business_name || "SkillBridge pro";
  return {
    id: api.id,
    fullName,
    initials: initialsFor(fullName),
    headline: api.headline || api.business_name,
    location: api.service_area,
    yearsOnPlatform: api.years_of_experience,
    jobsCompleted: api.jobs_completed,
    rating: mapRating(api.rating),
    verifications: api.verifications ?? [],
    bio: api.short_bio || undefined,
    responseTimeMinutes: api.response_time_minutes ?? undefined,
  };
}

interface ServiceMapContext {
  /** Provider ID for the parent resource — used when the service payload
   *  doesn't embed the full provider card (e.g. nested in detail). */
  providerId: string;
  providerName: string;
  serviceArea: string;
}

function priceParts(api: { price: string; pricing_type: ApiServiceMini["pricing_type"] }): {
  pricePerHour?: number;
  flatPrice?: number;
} {
  const parsed = Number.parseFloat(api.price);
  if (Number.isNaN(parsed)) return {};
  return api.pricing_type === "hourly"
    ? { pricePerHour: Math.round(parsed) }
    : { flatPrice: Math.round(parsed) };
}

export function mapServicePublic(api: ApiServicePublic): ServiceListing {
  return {
    id: api.id,
    providerId: api.provider.id,
    providerName: api.provider.full_name?.trim() || api.provider.business_name,
    category: mapCategory(api.category),
    title: api.title,
    subtitle: api.subtitle || undefined,
    ...priceParts(api),
    rating: mapRating(api.rating),
    locationType: api.location_type,
    serviceArea: api.provider.service_area,
    imageUrl: api.hero_image_url || undefined,
    isFeatured: api.is_featured,
    // Backend doesn't expose service-level availability windows yet;
    // returning an empty array keeps the type honest.
    availability: [] as AvailabilityWindow[],
  };
}

export function mapServiceMini(
  api: ApiServiceMini,
  ctx: ServiceMapContext,
): ServiceListing {
  return {
    id: api.id,
    providerId: ctx.providerId,
    providerName: ctx.providerName,
    category: mapCategory(api.category),
    title: api.title,
    subtitle: api.subtitle || undefined,
    ...priceParts(api),
    rating: mapRating(api.rating),
    locationType: api.location_type,
    serviceArea: ctx.serviceArea,
    imageUrl: api.hero_image_url || undefined,
    isFeatured: api.is_featured,
    availability: [] as AvailabilityWindow[],
  };
}

// ---- Reviews --------------------------------------------------------------

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Compact "X days ago" formatter used in the reviews card.
 *
 * Avoids pulling a full date library in for one cell of one card; if more
 * places start needing this, lift it to ``utils/date.ts``.
 */
function formatPostedAgo(iso: string, now: Date = new Date()): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const diff = Math.max(0, now.getTime() - ts);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  if (diff < MONTH) {
    const w = Math.floor(diff / WEEK);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  if (diff < YEAR) {
    const mo = Math.floor(diff / MONTH);
    return `${mo} month${mo === 1 ? "" : "s"} ago`;
  }
  const y = Math.floor(diff / YEAR);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

export function mapReview(api: ApiReview): Review {
  return {
    id: api.id,
    authorName: api.author_name,
    rating: api.rating,
    postedAgo: formatPostedAgo(api.created_at),
    body: api.body,
  };
}

// ---- Provider detail composite -------------------------------------------

export function mapProviderDetail(api: ApiProviderDetail): ProviderDetail {
  const summary = mapProviderSummary(api);
  return {
    ...summary,
    bio: api.short_bio ?? "",
    servicesOffered: (api.services_offered ?? []).map((service) =>
      mapServiceMini(service, {
        providerId: summary.id,
        providerName: summary.fullName,
        serviceArea: summary.location,
      }),
    ),
    reviews: (api.reviews ?? []).map(mapReview),
    // Availability is not yet exposed by the backend. The UI renders the
    // empty state ("No upcoming availability") until it ships.
    availability: [],
  };
}
