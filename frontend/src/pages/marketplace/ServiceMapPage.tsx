import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { appConfig } from "@/app/config";
import { GoogleServiceMap } from "@/components/maps/GoogleServiceMap";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { marketplaceService } from "@/services/marketplaceService";
import type { ServiceListing } from "@/types/marketplace";

interface RouteState {
  from?: string;
  fromLabel?: string;
}

export function ServiceMapPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const location = useLocation();
  const routeState = location.state as RouteState | null;
  const [service, setService] = useState<ServiceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!serviceId) {
      setError("Missing service id.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    marketplaceService
      .getService(serviceId)
      .then(setService)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load service.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const backHref = routeState?.from ?? "/marketplace";
  const backLabel = routeState?.fromLabel ?? "Back to marketplace";

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-9.5rem)] bg-brand-background px-6 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <LoadingState variant="profile" label="Loading service map…" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-[calc(100vh-9.5rem)] bg-brand-background px-6 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <ErrorState
            title="Couldn't load service location"
            description={error ?? "Service not found."}
            onRetry={load}
          />
        </div>
      </div>
    );
  }

  return <MapBody service={service} backHref={backHref} backLabel={backLabel} />;
}

function MapBody({
  service,
  backHref,
  backLabel,
}: {
  service: ServiceListing;
  backHref: string;
  backLabel: string;
}) {
  const addressLines = useMemo(() => buildAddressLines(service), [service]);
  const addressQuery = addressLines.join(", ");
  const hasCoordinates =
    typeof service.latitude === "number" && typeof service.longitude === "number";
  const hasAddress = addressLines.length > 0;
  const hasGoogleMapsApiKey = appConfig.hasGoogleMapsApiKey;

  return (
    <div className="relative min-h-[calc(100vh-9.5rem)] overflow-hidden bg-brand-background">
      {hasCoordinates || hasAddress ? (
        <GoogleServiceMap
          center={
            hasCoordinates
              ? { lat: service.latitude!, lng: service.longitude! }
              : undefined
          }
          address={hasCoordinates ? undefined : addressQuery}
          markerTitle={service.serviceLocationName ?? service.title}
          className="min-h-[calc(100vh-9.5rem)]"
        />
      ) : (
        <div className="flex min-h-[calc(100vh-9.5rem)] items-center justify-center bg-brand-surface/50 px-6">
          <div className="max-w-md rounded-2xl border border-brand-borderLight bg-white p-6 text-center shadow-card">
            <p className="text-base font-semibold text-brand-logo">
              Location unavailable
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              This service does not have coordinates or address details yet.
            </p>
            {addressLines.length > 0 && (
              <p className="mt-4 text-sm font-medium text-brand-logo">
                {addressLines.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {hasGoogleMapsApiKey && (
        <aside className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-4 sm:inset-x-auto sm:left-6 sm:top-1/2 sm:-translate-y-1/2 sm:justify-start sm:px-0">
          <div className="pointer-events-auto w-full max-w-[330px] overflow-hidden rounded-lg border border-white/70 bg-white/85 shadow-card backdrop-blur-md">
            <div className="flex items-center gap-3 bg-[#dcecf8]/90 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm text-white shadow-sm">
                <MapPinIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-logo">
                  Service location
                </p>
                <p className="truncate text-xs font-semibold text-brand-logo">
                  Map view - {service.serviceCity || service.serviceArea || "Location"}
                </p>
              </div>
            </div>

            <div className="px-5 py-5">
              <span className="inline-flex rounded-full bg-brand-primary/15 px-2.5 py-1 text-[11px] font-semibold text-brand-logo">
                {service.category.label}
              </span>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-logo">
                {service.title}
              </h1>

              <div className="mt-4 flex items-center gap-3 border-b border-brand-borderLight pb-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                  {initialsFor(service.providerName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-logo">
                    {service.providerName}
                  </p>
                  <p className="text-xs font-medium text-brand-muted">
                    ★ {service.rating.average.toFixed(1)} ·{" "}
                    {service.rating.count.toLocaleString()} reviews
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-4 text-sm">
                <InfoRow
                  label="Location"
                  value={service.serviceLocationName || service.serviceArea}
                />
                <InfoRow label="Address" value={formatAddress(service)} />
                <InfoRow label="Availability" value="By appointment" />
              </dl>

              <div className="mt-5 space-y-2 border-t border-brand-borderLight pt-4">
                <Link
                  to={`/providers/${service.providerId}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryHover hover:text-white"
                >
                  View provider
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to={backHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand-borderLight bg-white px-4 py-2.5 text-sm font-semibold text-brand-logo transition-colors hover:bg-brand-surface hover:text-brand-logo"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  {backLabel}
                </Link>

                {(hasCoordinates || hasAddress) && (
                  <a
                    href={googleMapsHref(service)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 pt-2 text-xs font-semibold text-brand-primary transition-colors hover:text-brand-primaryHover"
                  >
                    Open in Google Maps
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {hasGoogleMapsApiKey && <MapControlStack />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </dt>
      <dd className="mt-1 text-brand-logo">{value || "Not provided"}</dd>
    </div>
  );
}

function buildAddressLines(service: ServiceListing): string[] {
  const precise = [
    service.serviceLocationName,
    service.serviceAddress,
    service.serviceCity,
    service.serviceCountry,
  ].filter((part): part is string => Boolean(part));

  return precise.length > 0
    ? precise
    : [service.serviceArea].filter((part): part is string => Boolean(part));
}

function formatAddress(service: ServiceListing): string | undefined {
  const parts = [
    service.serviceAddress,
    service.serviceCity,
    service.serviceCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function googleMapsHref(service: ServiceListing): string {
  if (typeof service.latitude === "number" && typeof service.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    buildAddressLines(service).join(", "),
  )}`;
}

function MapControlStack() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-24 right-4 z-10 flex flex-col gap-2 sm:right-6"
    >
      <MapControlIcon>
        <PlusIcon className="h-4 w-4" />
      </MapControlIcon>
      <MapControlIcon>
        <MinusIcon className="h-4 w-4" />
      </MapControlIcon>
      <MapControlIcon>
        <GlobeIcon className="h-4 w-4" />
      </MapControlIcon>
    </div>
  );
}

function MapControlIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-borderLight bg-white/95 text-brand-logo shadow-card">
      {children}
    </span>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.75a6.75 6.75 0 0 0-6.75 6.75c0 4.82 5.64 10.86 5.88 11.11a1.2 1.2 0 0 0 1.74 0c.24-.25 5.88-6.29 5.88-11.11A6.75 6.75 0 0 0 12 2.75Zm0 9.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M19 12H5m6-6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M7 17 17 7m-7 0h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.1 2.25 3.15 5.08 3.15 8.5S14.1 18.25 12 20.5c-2.1-2.25-3.15-5.08-3.15-8.5S9.9 5.75 12 3.5Z" />
    </svg>
  );
}
