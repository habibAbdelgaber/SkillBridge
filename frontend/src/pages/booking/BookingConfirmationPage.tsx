import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Section } from "@/components/ui/Section";
import { bookingService } from "@/services/bookingService";
import type { Booking } from "@/types/booking";
import { cn } from "@/utils/cn";

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

interface CancelState {
  busy: boolean;
  error: string | null;
}

/**
 * "/bookings/:bookingId"
 *
 * Renders the "Your booking request was sent" surface that the booking
 * POST routes to. Layout matches the Figma comp:
 *
 *   [ sky-tinted hero card ]
 *     concentric rings around a clock glyph
 *     "Awaiting provider response" pill
 *     headline + reassurance copy
 *
 *   [ white body card ]
 *     provider mini (avatar + name + rating)
 *     request details (id / service / time / duration / address / total)
 *     "What happens next" 3-step list
 *     Track + Message / Cancel buttons
 *     escrow reassurance footer
 *
 *   "Need something else? Browse more services →"
 */
export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancel, setCancel] = useState<CancelState>({ busy: false, error: null });

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking id.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await bookingService.get(bookingId);
        if (!cancelled) setBooking(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load booking.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (isLoading) {
    return (
      <Section tone="surface" innerClassName="mx-auto w-full max-w-3xl px-6 py-14">
        <LoadingState variant="profile" label="Loading booking…" />
      </Section>
    );
  }

  if (error || !booking) {
    return (
      <Section tone="surface" innerClassName="mx-auto w-full max-w-3xl px-6 py-14">
        <ErrorState
          title="Couldn't load booking"
          description={error ?? "Booking not found."}
        />
      </Section>
    );
  }

  const isCancelled = booking.status === "cancelled";
  const isConfirmed = booking.status === "confirmed";
  const display = makeDisplay(booking);
  const firstName =
    (booking.provider.businessName || "your pro").split(" ")[0] ?? "Your pro";
  const initials = computeInitials(booking.provider.businessName);

  async function handleCancel() {
    if (!booking || cancel.busy || isCancelled) return;
    const ok = window.confirm(
      "Cancel this booking? The provider will be notified and your card won't be charged.",
    );
    if (!ok) return;
    setCancel({ busy: true, error: null });
    try {
      const updated = await bookingService.cancel(booking.id);
      setBooking(updated);
      setCancel({ busy: false, error: null });
    } catch (err) {
      setCancel({
        busy: false,
        error: err instanceof Error ? err.message : "Failed to cancel.",
      });
    }
  }

  return (
    <Section
      tone="surface"
      innerClassName="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14"
    >
      <article className="overflow-hidden rounded-2xl border border-brand-borderLight bg-white shadow-card">
        {/* ---- Hero band ----------------------------------------------- */}
        <header className="relative overflow-hidden bg-gradient-to-b from-sky-100/80 via-sky-50 to-white px-6 pt-10 pb-8 text-center sm:px-10 sm:pt-12">
          <ConcentricRings className="mx-auto" />

          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-logo shadow-sm">
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isConfirmed
                  ? "bg-emerald-500"
                  : isCancelled
                    ? "bg-rose-500"
                    : "bg-amber-500",
              )}
            />
            {isConfirmed
              ? "Provider accepted"
              : isCancelled
                ? "Request cancelled"
                : "Awaiting provider response"}
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-logo sm:text-[28px]">
            {isCancelled ? "Booking cancelled" : "Your booking request was sent!"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-muted">
            {isCancelled
              ? "We've let the provider know. You can browse other pros whenever you're ready."
              : `${booking.provider.businessName} has been notified and typically responds within 1 hour. We'll email you the moment they accept — your card will only be charged then.`}
          </p>
        </header>

        {/* ---- Body card ----------------------------------------------- */}
        <div className="px-6 pb-8 pt-6 sm:px-10">
          {/* Provider mini */}
          <div className="flex items-start gap-3 rounded-xl border border-brand-borderLight bg-white p-4">
            <div
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-logo">
                {booking.provider.businessName}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
                <span className="truncate">
                  {booking.provider.headline || "Verified provider"}
                </span>
              </p>
            </div>
          </div>

          {/* Detail rows */}
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <DetailRow label="Request ID" value={display.shortId} />
            <DetailRow label="Service" value={booking.service.title} />
            <DetailRow label="Requested time" value={display.when} />
            <DetailRow label="Est. duration" value={display.duration} />
            {display.address && <DetailRow label="Address" value={display.address} />}
            <DetailRow
              label="Estimated total"
              value={
                <>
                  {display.total}
                  <span className="ml-1 text-xs font-normal text-brand-muted">
                    (held only after acceptance)
                  </span>
                </>
              }
            />
          </dl>

          {/* What happens next */}
          <div className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              What happens next
            </p>
            <ol className="mt-3 space-y-3.5">
              <NextStep
                index={1}
                title="Provider reviews your request"
                detail="They confirm availability and the scope of work. Typically takes under 1 hour."
              />
              <NextStep
                index={2}
                title="You're notified by email + push"
                detail={`If accepted, your card is charged ${display.total} and held in escrow via Stripe.`}
              />
              <NextStep
                index={3}
                title="Job is scheduled & funds released after completion"
                detail={`We release payment to ${firstName} only once you confirm the job is done.`}
              />
            </ol>
          </div>

          {/* CTAs */}
          <div className="mt-7 space-y-2.5">
            <button
              type="button"
              disabled={isCancelled}
              className={cn(
                "inline-flex w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors",
                isCancelled
                  ? "cursor-not-allowed bg-brand-borderLight text-brand-muted"
                  : "bg-brand-primary text-white hover:bg-brand-primaryHover",
              )}
            >
              {isCancelled ? "Request cancelled" : "Track my request"}
            </button>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                disabled={isCancelled}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-md border bg-white px-4 py-2.5 text-sm font-semibold transition-colors",
                  isCancelled
                    ? "cursor-not-allowed border-brand-borderLight text-brand-muted"
                    : "border-brand-borderLight text-brand-logo hover:border-brand-primary hover:text-brand-primary",
                )}
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
                    d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Message {firstName}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancel.busy || isCancelled}
                aria-busy={cancel.busy || undefined}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-md border bg-white px-4 py-2.5 text-sm font-semibold transition-colors",
                  isCancelled || cancel.busy
                    ? "cursor-not-allowed border-brand-borderLight text-brand-muted"
                    : "border-brand-borderLight text-brand-logo hover:border-rose-300 hover:text-rose-600",
                )}
              >
                {cancel.busy ? "Cancelling…" : "Cancel request"}
              </button>
            </div>

            {cancel.error && <p className="text-xs text-rose-600">{cancel.error}</p>}
          </div>

          {/* Escrow reassurance */}
          <p className="mt-6 flex items-start gap-2 rounded-md bg-brand-surface/50 px-4 py-3 text-xs leading-relaxed text-brand-muted">
            <span aria-hidden="true" className="mt-0.5">
              🔒
            </span>
            <span>
              No charge yet. Your card is only authorized after the provider accepts
              your request, and funds are held in escrow until the job is done.
            </span>
          </p>
        </div>
      </article>

      {/* Footer prompt */}
      <p className="mt-6 text-center text-sm text-brand-muted">
        Need to do something else?{" "}
        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          className="font-semibold text-brand-primary hover:text-brand-primaryHover"
        >
          Browse more services →
        </button>
      </p>
    </Section>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <>
      <dt className="text-brand-muted">{label}</dt>
      <dd className="text-right font-semibold text-brand-logo">{value}</dd>
    </>
  );
}

interface NextStepProps {
  index: number;
  title: string;
  detail: string;
}

function NextStep({ index, title, detail }: NextStepProps) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-primary/30 bg-white text-xs font-semibold text-brand-primary"
      >
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-logo">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">{detail}</p>
      </div>
    </li>
  );
}

/**
 * Two faint outer rings + a solid brand-primary disc with a clock glyph.
 * Decorative — no interactive elements, no animations per the brief.
 */
function ConcentricRings({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-full border border-sky-200/70" />
      <span className="absolute inset-2 rounded-full border border-sky-200/90" />
      <span className="absolute inset-4 rounded-full bg-white" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white shadow-md sm:h-14 sm:w-14">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="h-6 w-6 sm:h-7 sm:w-7"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

interface DisplayShape {
  shortId: string;
  service: string;
  when: string;
  duration: string;
  address: string | null;
  total: string;
}

function makeDisplay(booking: Booking): DisplayShape {
  const dateObj = parseLocalDate(booking.scheduledDate);
  const startObj = combine(dateObj, booking.startTime);
  const dateLabel = DATE_FORMATTER.format(dateObj);
  const timeLabel = TIME_FORMATTER.format(startObj);
  return {
    shortId: shortId(booking.id),
    service: booking.service.title,
    when: `${dateLabel} · ${timeLabel}`,
    duration: formatDuration(booking.service.durationMinutes),
    address: extractAddress(booking.notes),
    total: PRICE_FORMATTER.format(Number(booking.totalPrice) || 0),
  };
}

function shortId(uuid: string): string {
  return `#SB-${uuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? "hour" : "hours"}`;
}

/**
 * The booking page packs the customer-typed address into ``notes`` as
 * "Address: <line>\n\n<rest>". Pull it back out so the confirmation
 * card can display it as its own row.
 */
function extractAddress(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/^Address:\s*(.+?)(?:\n|$)/);
  return match ? match[1]!.trim() : null;
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return "SB";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

function combine(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h ?? 0, m ?? 0);
}
