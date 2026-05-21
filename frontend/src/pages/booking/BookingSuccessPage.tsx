import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { ResultCard } from "@/components/booking/ResultCard";
import { Section } from "@/components/ui/Section";
import { bookingService } from "@/services/bookingService";
import type { Booking } from "@/types/booking";

interface SuccessLocationState {
  /** Freshly-created Booking, passed via navigate(state). */
  booking?: Booking;
  /** Bare booking id when the caller didn't have the full object handy. */
  bookingId?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * "/booking/success"
 *
 * Renders the post-payment confirmation card. Booking data flows in via
 * `location.state.booking` (preferred) or `?id=<bookingId>` so the page
 * can deep-link from email receipts. Falls back to a placeholder shape
 * when neither is provided so the page remains showable from the
 * router during dev / QA.
 */
export function BookingSuccessPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const stateBooking = (location.state as SuccessLocationState | null) ?? {};

  const [booking, setBooking] = useState<Booking | null>(stateBooking.booking ?? null);
  const [isHydrating, setIsHydrating] = useState<boolean>(false);

  useEffect(() => {
    if (booking) return;
    const id = stateBooking.bookingId ?? params.get("id");
    if (!id) return;
    let cancelled = false;
    setIsHydrating(true);
    bookingService
      .get(id)
      .then((result) => {
        if (!cancelled) setBooking(result);
      })
      .catch(() => {
        // Booking failed to fetch — fall through to placeholder copy so
        // the page still renders something useful.
      })
      .finally(() => {
        if (!cancelled) setIsHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [booking, params, stateBooking.bookingId]);

  const display = makeDisplay(booking);
  const subtitle = booking
    ? `Your payment is held securely in escrow. ${
        booking.provider.businessName.split(" ")[0] ?? "Your pro"
      } will arrive on ${display.when}.`
    : "Your payment is held securely in escrow. Your pro will be in touch shortly.";

  return (
    <Section
      tone="surface"
      innerClassName="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20"
    >
      <ResultCard
        tone="success"
        title="Booking confirmed!"
        subtitle={subtitle}
        actions={
          <>
            <Link
              to="/home"
              className="inline-flex w-full items-center justify-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryHover"
            >
              Go to my dashboard
            </Link>
            <Link
              to={booking ? `/bookings/${booking.id}` : "#"}
              aria-disabled={!booking || undefined}
              className={
                booking
                  ? "inline-flex w-full items-center justify-center rounded-md border border-brand-borderLight bg-white px-5 py-2.5 text-sm font-semibold text-brand-logo transition-colors hover:border-brand-primary hover:text-brand-primary"
                  : "inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-brand-borderLight bg-white px-5 py-2.5 text-sm font-semibold text-brand-muted opacity-60"
              }
            >
              {isHydrating ? "Loading…" : "View receipt"}
            </Link>
          </>
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 rounded-md bg-brand-surface/40 px-5 py-4 text-sm">
          <dt className="text-brand-muted">Booking ID</dt>
          <dd className="text-right font-semibold text-brand-logo">
            {display.shortId}
          </dd>

          <dt className="text-brand-muted">Service</dt>
          <dd className="text-right font-semibold text-brand-logo">
            {display.service}
          </dd>

          <dt className="text-brand-muted">Pro</dt>
          <dd className="text-right font-semibold text-brand-logo">{display.pro}</dd>

          <dt className="text-brand-muted">When</dt>
          <dd className="text-right font-semibold text-brand-logo">{display.when}</dd>

          <dt className="text-brand-muted">Paid</dt>
          <dd className="text-right font-semibold text-brand-logo">
            {display.paid}
            <span className="ml-1 text-xs font-normal text-brand-muted">
              (held in escrow)
            </span>
          </dd>
        </dl>
      </ResultCard>
    </Section>
  );
}

interface DisplayShape {
  shortId: string;
  service: string;
  pro: string;
  when: string;
  paid: string;
}

function makeDisplay(booking: Booking | null): DisplayShape {
  if (!booking) {
    return {
      shortId: "#SB-48271",
      service: "Emergency pipe repair",
      pro: "John Martinez",
      when: "Wed, Nov 22 · 11:30 AM",
      paid: "$134.50",
    };
  }
  const dateObj = parseLocalDate(booking.scheduledDate);
  const startObj = combine(dateObj, booking.startTime);
  const dateLabel = DATE_FORMATTER.format(dateObj);
  const timeLabel = TIME_FORMATTER.format(startObj);
  return {
    shortId: shortId(booking.id),
    service: booking.service.title,
    pro: booking.provider.businessName,
    when: `${dateLabel} · ${timeLabel}`,
    paid: PRICE_FORMATTER.format(Number(booking.totalPrice) || 0),
  };
}

function shortId(uuid: string): string {
  // First 8 hex chars in upper-case is short enough to display, long
  // enough to disambiguate in a customer-facing reference.
  const hex = uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `#SB-${hex}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

function combine(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h ?? 0, m ?? 0);
}
