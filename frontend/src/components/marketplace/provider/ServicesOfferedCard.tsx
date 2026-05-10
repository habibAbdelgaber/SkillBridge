import { Link, useLocation } from "react-router-dom";

import type { ServiceListing } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface ServicesOfferedCardProps {
  services: ServiceListing[];
  className?: string;
}

function formatPrice(service: ServiceListing): string {
  if (service.pricePerHour != null) return `$${service.pricePerHour}/hr`;
  if (service.flatPrice != null) return `$${service.flatPrice}/flat`;
  return "—";
}

export function ServicesOfferedCard({ services, className }: ServicesOfferedCardProps) {
  const location = useLocation();

  return (
    <section
      aria-labelledby="services-heading"
      className={cn(
        "rounded-2xl border border-brand-borderLight bg-white p-6 shadow-card",
        className,
      )}
    >
      <h2 id="services-heading" className="text-lg font-semibold text-brand-logo">
        Services offered
      </h2>

      <ul className="mt-4 divide-y divide-brand-borderLight">
        {services.map((service) => (
          <li
            key={service.id}
            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                to={`/services/${service.id}/map`}
                state={{ from: location.pathname, fromLabel: "Back to provider" }}
                className="block truncate text-sm font-semibold text-brand-logo hover:text-brand-primary"
              >
                {service.title}
              </Link>
              {service.subtitle && (
                <p className="mt-0.5 truncate text-xs text-brand-muted">
                  {service.subtitle}
                </p>
              )}
              <Link
                to={`/services/${service.id}/map`}
                state={{ from: location.pathname, fromLabel: "Back to provider" }}
                className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-brand-muted hover:text-brand-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="truncate">{formatServiceLocation(service)}</span>
              </Link>
            </div>
            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-brand-primary">
              {formatPrice(service)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatServiceLocation(service: ServiceListing): string {
  return (
    service.serviceLocationName ||
    [service.serviceCity, service.serviceCountry].filter(Boolean).join(", ") ||
    service.serviceArea ||
    "View location"
  );
}
