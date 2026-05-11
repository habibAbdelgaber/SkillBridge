import { useEffect, useMemo, useState } from "react";
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
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/60 bg-white/65 p-5 shadow-card backdrop-blur-md">
            <Link
              to={backHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primaryHover"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M19 12H5m6-6-6 6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {backLabel}
            </Link>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
                Service location
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-logo">
                {service.title}
              </h1>
              <p className="mt-1 text-sm font-medium text-brand-muted">
                {service.providerName}
              </p>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <InfoRow label="Location name" value={service.serviceLocationName} />
              <InfoRow label="Address" value={service.serviceAddress} />
              <InfoRow label="City" value={service.serviceCity} />
              <InfoRow label="Country" value={service.serviceCountry} />
              <InfoRow label="Service area" value={service.serviceArea} />
            </dl>

            {(hasCoordinates || hasAddress) && (
              <a
                href={googleMapsHref(service)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryHover hover:text-white"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </aside>
      )}
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

function googleMapsHref(service: ServiceListing): string {
  if (typeof service.latitude === "number" && typeof service.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    buildAddressLines(service).join(", "),
  )}`;
}
