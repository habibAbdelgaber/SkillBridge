import { useNavigate, useParams } from "react-router-dom";

import { AboutCard } from "@/components/marketplace/provider/AboutCard";
import { AvailabilityCard } from "@/components/marketplace/provider/AvailabilityCard";
import { ProfileHeader } from "@/components/marketplace/provider/ProfileHeader";
import { ReviewsCard } from "@/components/marketplace/provider/ReviewsCard";
import { SafetyCard } from "@/components/marketplace/provider/SafetyCard";
import { ServicesOfferedCard } from "@/components/marketplace/provider/ServicesOfferedCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Section } from "@/components/ui/Section";
import { useProvider } from "@/hooks/useProvider";
import type { ProviderDetail, ServiceListing } from "@/types/marketplace";

/**
 * Provider profile page.
 *
 * Layout (≥lg):
 *   [ Breadcrumb                               ]
 *   [ Profile hero with stacked CTAs           ]
 *   [ About | Services | Reviews ][ Avail | Safety ]
 *
 * The hero "Book now" CTA mirrors the design copy "Book now · From $X/hr"
 * — the price is the lowest service rate offered by the provider, not a
 * fixed value. Sidebar is sticky on lg+ so the booking widget stays in
 * view as the customer scrolls reviews.
 */
export function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const { data: provider, isLoading, error, refetch } = useProvider(providerId);
  const navigate = useNavigate();

  return (
    <Section
      tone="surface"
      innerClassName="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14"
    >
      {isLoading && <LoadingState variant="profile" label="Loading provider…" />}

      {!isLoading && error && (
        <div className="space-y-6">
          <Breadcrumb
            items={[
              { label: "Marketplace", to: "/marketplace" },
              { label: "Provider" },
            ]}
          />
          <ErrorState
            title="Provider unavailable"
            description={error.message}
            onRetry={refetch}
          />
        </div>
      )}

      {!isLoading && !error && provider && (
        <ProfileBody
          provider={provider}
          onBook={(slot) => {
            // Pick the cheapest service offered so the booking page lands
            // on a sane default; the page itself can later expose a
            // service-picker if a provider has multiple offerings.
            const target = pickDefaultService(provider.servicesOffered);
            if (!target) {
              navigate(`/providers/${provider.id}#no-services`);
              return;
            }
            const params = new URLSearchParams();
            params.set("date", slot.date);
            params.set("time", slot.time);
            navigate(`/book/${target.id}?${params.toString()}`);
          }}
        />
      )}
    </Section>
  );
}

interface ProfileBodyProps {
  provider: ProviderDetail;
  onBook: (slot: { date: string; time: string }) => void;
}

function ProfileBody({ provider, onBook }: ProfileBodyProps) {
  const primaryCategory = provider.servicesOffered[0]?.category ?? null;
  const minPrice = computeMinHourlyPrice(provider.servicesOffered);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Marketplace", to: "/marketplace" },
          ...(primaryCategory
            ? [
                {
                  label: primaryCategory.label,
                  to: `/marketplace?category=${primaryCategory.slug}`,
                },
              ]
            : []),
          { label: provider.fullName },
        ]}
      />

      <ProfileHeader
        provider={provider}
        cta={
          <>
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("availability")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primaryHover"
            >
              <span>Book now</span>
              {minPrice != null && (
                <>
                  <span aria-hidden="true" className="text-white/70">
                    ·
                  </span>
                  <span className="font-medium text-white/90">From ${minPrice}/hr</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-brand-borderLight bg-white px-6 py-2.5 text-sm font-semibold text-brand-logo transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              Send message
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <AboutCard bio={provider.bio} />
          <ServicesOfferedCard services={provider.servicesOffered} />
          <ReviewsCard reviews={provider.reviews} count={provider.rating.count} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div id="availability">
            <AvailabilityCard days={provider.availability} onContinue={onBook} />
          </div>
          <SafetyCard verifications={provider.verifications} />
        </div>
      </div>
    </div>
  );
}

/**
 * Smallest hourly rate across the provider's services.
 *
 * Falls back to flat-priced services divided by an arbitrary 1-hour
 * baseline only when no hourly service exists; if even that's empty
 * (no priced services at all) the function returns null and the CTA
 * drops the price suffix.
 */
function computeMinHourlyPrice(services: ServiceListing[]): number | null {
  const hourly = services
    .map((service) => service.pricePerHour)
    .filter((price): price is number => typeof price === "number");
  if (hourly.length > 0) return Math.min(...hourly);

  const flat = services
    .map((service) => service.flatPrice)
    .filter((price): price is number => typeof price === "number");
  if (flat.length > 0) return Math.min(...flat);

  return null;
}

/**
 * Pick the default service to send the booking flow against.
 *
 * Prefers the cheapest hourly service so "Book now" lands on the
 * lowest commitment; falls back to the cheapest flat-priced service,
 * then to the first service in the list. The booking page itself can
 * surface a service-picker once the provider exposes multiple
 * offerings the customer needs to disambiguate.
 */
function pickDefaultService(services: ServiceListing[]): ServiceListing | null {
  if (services.length === 0) return null;
  const sorted = [...services].sort((a, b) => {
    const aPrice = a.pricePerHour ?? a.flatPrice ?? Number.POSITIVE_INFINITY;
    const bPrice = b.pricePerHour ?? b.flatPrice ?? Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  });
  return sorted[0] ?? null;
}
