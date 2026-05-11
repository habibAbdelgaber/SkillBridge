import { useEffect, useRef, useState } from "react";

import { appConfig } from "@/app/config";
import { cn } from "@/utils/cn";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: {
            center: GoogleLatLng;
            zoom: number;
            mapTypeControl?: boolean;
            streetViewControl?: boolean;
            fullscreenControl?: boolean;
          },
        ) => unknown;
        Marker: new (options: {
          position: GoogleLatLng;
          map: unknown;
          title?: string;
        }) => unknown;
        Geocoder: new () => {
          geocode: (
            request: { address: string },
            callback: (
              results: Array<{
                geometry: {
                  location: {
                    lat: () => number;
                    lng: () => number;
                  };
                };
              }> | null,
              status: string,
            ) => void,
          ) => void;
        };
      };
    };
    __skillBridgeGoogleMapsPromise?: Promise<void>;
  }
}

interface GoogleLatLng {
  lat: number;
  lng: number;
}

interface GoogleServiceMapProps {
  center?: GoogleLatLng;
  address?: string;
  markerTitle: string;
  className?: string;
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__skillBridgeGoogleMapsPromise) {
    return window.__skillBridgeGoogleMapsPromise;
  }

  window.__skillBridgeGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-skillbridge-google-maps]",
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps failed to load.")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.skillbridgeGoogleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return window.__skillBridgeGoogleMapsPromise;
}

export function GoogleServiceMap({
  center,
  address,
  markerTitle,
  className,
}: GoogleServiceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!appConfig.googleMapsApiKey) {
      setStatus("loading");
      setError(null);
      return;
    }

    setStatus("loading");
    setError(null);

    loadGoogleMaps(appConfig.googleMapsApiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.google?.maps) return;
        if (center) {
          renderMap(center);
          return;
        }
        if (!address) {
          setStatus("error");
          setError("No coordinates or address were provided for this service.");
          return;
        }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, geocodeStatus) => {
          if (cancelled) return;
          const location = results?.[0]?.geometry.location;
          if (!location || geocodeStatus !== "OK") {
            setStatus("error");
            setError("Google Maps could not find this service address.");
            return;
          }
          renderMap({ lat: location.lat(), lng: location.lng() });
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Google Maps failed to load.");
      });

    return () => {
      cancelled = true;
    };
    function renderMap(position: GoogleLatLng) {
      if (!mapRef.current || !window.google?.maps) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      new window.google.maps.Marker({
        position,
        map,
        title: markerTitle,
      });
      setStatus("ready");
    }
  }, [address, center, markerTitle]);

  return (
    <div
      className={cn("relative h-full min-h-[520px] w-full bg-brand-surface", className)}
    >
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-background/60">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="absolute inset-0 h-full w-full animate-spin text-brand-primary"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="42"
                strokeDashoffset="14"
              />
            </svg>
            <span className="max-w-16 text-center text-xs font-semibold leading-tight text-brand-logo">
              Loading map…
            </span>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-background px-6 text-center">
          <div className="max-w-sm rounded-xl border border-brand-borderLight bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-brand-logo">Map unavailable</p>
            <p className="mt-1 text-sm text-brand-muted">
              {error ?? "Check your Google Maps configuration and try again."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
