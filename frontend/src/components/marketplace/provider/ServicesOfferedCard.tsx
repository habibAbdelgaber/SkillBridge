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

/**
 * "Services offered" list rendered as a simple two-column row layout:
 * title + subtitle on the left, price (accent color) on the right. The
 * provider context is already established in the hero, so we drop the
 * category pill and per-row rating that the marketplace card uses.
 */
export function ServicesOfferedCard({ services, className }: ServicesOfferedCardProps) {
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
              <p className="truncate text-sm font-semibold text-brand-logo">
                {service.title}
              </p>
              {service.subtitle && (
                <p className="mt-0.5 truncate text-xs text-brand-muted">
                  {service.subtitle}
                </p>
              )}
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
