/** Maps Django REST payloads into marketplace UI types. */
import type {
  AvailabilityDay,
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
  service_location_name?: string;
  service_address?: string;
  service_city?: string;
  service_country?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
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

interface ApiAvailabilitySlot {
  start_time: string;
  end_time: string;
}

interface ApiAvailabilityDay {
  date: string;
  weekday: number;
  slots: ApiAvailabilitySlot[];
}

export interface ApiProviderDetail extends ApiProviderSummary {
  services_offered: ApiServiceMini[];
  reviews: ApiReview[];
  availability?: ApiAvailabilityDay[];
}

export interface ApiPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function mapCategory(api: ApiCategory): Category {
  return { slug: api.slug, label: api.name };
}

function initialsFor(name: string): string {
  // Keep avatar placeholders visible when no image exists.
  const parts = name.trim().split(/\s+/u).filter(Boolean);
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
  providerId: string;
  providerName: string;
  serviceArea: string;
}

function priceParts(api: {
  price: string;
  pricing_type: ApiServiceMini["pricing_type"];
}): {
  pricePerHour?: number;
  flatPrice?: number;
} {
  const parsed = Number.parseFloat(api.price);
  if (Number.isNaN(parsed)) return {};
  return api.pricing_type === "hourly"
    ? { pricePerHour: Math.round(parsed) }
    : { flatPrice: Math.round(parsed) };
}

function coordinate(value: string | number | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function locationParts(
  api: ApiServiceMini,
): Pick<
  ServiceListing,
  | "serviceLocationName"
  | "serviceAddress"
  | "serviceCity"
  | "serviceCountry"
  | "latitude"
  | "longitude"
> {
  return {
    serviceLocationName: api.service_location_name || undefined,
    serviceAddress: api.service_address || undefined,
    serviceCity: api.service_city || undefined,
    serviceCountry: api.service_country || undefined,
    latitude: coordinate(api.latitude),
    longitude: coordinate(api.longitude),
  };
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
    ...locationParts(api),
    serviceArea: api.provider.service_area,
    imageUrl: api.hero_image_url || undefined,
    isFeatured: api.is_featured,
    // Service-level availability is not exposed yet.
    availability: [] as AvailabilityWindow[],
    durationMinutes: api.duration_minutes,
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
    ...locationParts(api),
    serviceArea: ctx.serviceArea,
    imageUrl: api.hero_image_url || undefined,
    isFeatured: api.is_featured,
    availability: [] as AvailabilityWindow[],
    durationMinutes: api.duration_minutes,
  };
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Compact "X days ago" formatter used in reviews. */
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
    // Keep the picker stable even when the backend omits availability.
    availability:
      api.availability && api.availability.length > 0
        ? api.availability.map(mapAvailabilityDay)
        : synthesizeEmptyWeek(),
  };
}

const WEEKDAY_SHORT: readonly string[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function mapAvailabilityDay(api: ApiAvailabilityDay): AvailabilityDay {
  // Local noon avoids date labels drifting across timezones.
  const [year, month, day] = api.date.split("-").map(Number);
  const local = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
  const weekdayShort =
    WEEKDAY_SHORT[api.weekday] ??
    local.toLocaleDateString(undefined, { weekday: "short" });
  return {
    date: api.date,
    weekdayShort,
    dayOfMonth: String(local.getDate()),
    slots: (api.slots ?? []).map((slot) => formatSlotStart(slot.start_time)),
  };
}

/** Reduce a slot to the "HH:MM" label shown in the picker. */
function formatSlotStart(rawStart: string): string {
  // Normalize defensively in case a future serializer includes seconds.
  const [hh, mm] = rawStart.split(":");
  return `${(hh ?? "00").padStart(2, "0")}:${(mm ?? "00").padStart(2, "0")}`;
}

function synthesizeEmptyWeek(today: Date = new Date()): AvailabilityDay[] {
  // Empty slots keep the date strip visible but disabled.
  const out: AvailabilityDay[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i, 12);
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    // Map JS getDay onto Python's date.weekday.
    const pyWeekday = (d.getDay() + 6) % 7;
    out.push({
      date: isoDate,
      weekdayShort: WEEKDAY_SHORT[pyWeekday] ?? "—",
      dayOfMonth: String(d.getDate()),
      slots: [],
    });
  }
  return out;
}
