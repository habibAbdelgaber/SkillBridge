import { Link } from "react-router-dom";

import { ServiceImage } from "@/components/marketplace/ServiceImage";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import type { ServiceListing } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface ProviderCardProps {
  listing: ServiceListing;
  className?: string;
}

const LOCATION_LABEL: Record<ServiceListing["locationType"], string> = {
  remote: "Remote",
  onsite: "On-site",
  hybrid: "On-site or remote",
};

export function ProviderCard({ listing, className }: ProviderCardProps) {
  const mapHref = `/services/${listing.id}/map`;
  const mapState = { from: "/marketplace", fromLabel: "Back to marketplace" };
  const locationLabel = formatServiceLocation(listing);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-md bg-white shadow-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative h-40 w-full overflow-hidden bg-brand-surface">
        <ServiceImage src={listing.imageUrl} />
        {listing.isFeatured && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Featured
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-brand-logo shadow-sm">
          {listing.category.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link
            to={mapHref}
            state={mapState}
            className="text-base font-semibold text-brand-logo hover:text-brand-primary"
          >
            {listing.title}
          </Link>
          <p className="mt-0.5 text-sm text-brand-muted">by {listing.providerName}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <RatingBadge average={listing.rating.average} count={listing.rating.count} />
          <Link
            to={mapHref}
            state={mapState}
            className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-brand-muted hover:text-brand-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span className="truncate">{locationLabel}</span>
          </Link>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-brand-borderLight/70 pt-4">
          <div>
            <PriceBadge
              hourly={listing.pricePerHour}
              flat={listing.flatPrice}
              size="md"
            />
            <p className="mt-0.5 text-[11px] text-brand-muted">
              {LOCATION_LABEL[listing.locationType]}
            </p>
          </div>
          <Link
            to={`/providers/${listing.providerId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-primaryHover"
          >
            View profile
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatServiceLocation(listing: ServiceListing): string {
  return (
    listing.serviceLocationName ||
    [listing.serviceCity, listing.serviceCountry].filter(Boolean).join(", ") ||
    listing.serviceArea ||
    "View location"
  );
}
