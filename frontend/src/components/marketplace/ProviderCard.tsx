import { Link } from "react-router-dom";

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

/**
 * Listing card.
 *
 * Tile-shaped, image on top, rating + price below. The whole card is a
 * router link to the provider profile so the entire surface feels
 * tappable on touch devices, while the inner CTA stays for sighted-mouse
 * users who expect a button affordance.
 */
export function ProviderCard({ listing, className }: ProviderCardProps) {
  return (
    <Link
      to={`/providers/${listing.providerId}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-brand-borderLight bg-white shadow-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative h-40 w-full overflow-hidden bg-brand-surface">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-brand-surface via-white to-brand-borderLight/60"
          />
        )}
        {listing.isFeatured && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Featured
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2 py-1 text-[11px] font-medium text-brand-logo shadow-sm">
          {listing.category.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold text-brand-logo group-hover:text-brand-primary">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-sm text-brand-muted">by {listing.providerName}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <RatingBadge average={listing.rating.average} count={listing.rating.count} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-muted">
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
            {listing.serviceArea}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-brand-borderLight/70 pt-4">
          <div>
            <PriceBadge hourly={listing.pricePerHour} flat={listing.flatPrice} size="md" />
            <p className="mt-0.5 text-[11px] text-brand-muted">
              {LOCATION_LABEL[listing.locationType]}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary group-hover:text-brand-primaryHover">
            View profile
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
