import type { ProviderSummary, ServiceListing } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface BookingSummaryCardProps {
  provider: ProviderSummary | null;
  service: ServiceListing | null;
  selectedDate: string | null;
  selectedTime: string | null;
  durationMinutes: number;
  serviceFee: number;
  platformFee: number;
  vat: number;
  total: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  bannerError?: string;
  className?: string;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function BookingSummaryCard({
  provider,
  service,
  selectedDate,
  selectedTime,
  durationMinutes,
  serviceFee,
  platformFee,
  vat,
  total,
  isSubmitting,
  canSubmit,
  onSubmit,
  bannerError,
  className,
}: BookingSummaryCardProps) {
  const dateLabel = selectedDate ? formatDate(selectedDate) : "—";
  const timeLabel = selectedTime ? formatTime(selectedTime) : "—";
  const durationLabel = formatDuration(durationMinutes);

  return (
    <aside
      aria-labelledby="booking-summary-heading"
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5 shadow-card",
        className,
      )}
    >
      <h2 id="booking-summary-heading" className="sr-only">
        Booking summary
      </h2>

      {provider && (
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white"
          >
            {provider.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-logo">
              {provider.fullName}
            </p>
            <p className="flex items-center gap-1 text-xs text-brand-muted">
              <span className="truncate">{provider.headline}</span>
              {provider.rating.count > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3 w-3 text-amber-400"
                    aria-hidden="true"
                  >
                    <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
                  </svg>
                  <span>{provider.rating.average.toFixed(1)}</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="my-4 h-px bg-brand-borderLight" />

      <dl className="space-y-2.5 text-sm">
        <SummaryRow label="Service" value={service?.title ?? "—"} />
        <SummaryRow label="Date" value={dateLabel} />
        <SummaryRow label="Time" value={timeLabel} />
        <SummaryRow label="Est. duration" value={durationLabel} />
      </dl>

      <div className="my-4 h-px bg-brand-borderLight" />

      <dl className="space-y-2.5 text-sm">
        <SummaryRow label="Service fee" value={CURRENCY_FORMATTER.format(serviceFee)} />
        <SummaryRow
          label="Platform fee"
          value={CURRENCY_FORMATTER.format(platformFee)}
        />
        <SummaryRow label="VAT" value={CURRENCY_FORMATTER.format(vat)} />
      </dl>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-base font-semibold text-brand-logo">Total</span>
        <span className="text-xl font-bold text-brand-logo">
          {CURRENCY_FORMATTER.format(total)}
        </span>
      </div>

      <p className="mt-4 rounded-md bg-sky-50/80 px-3 py-2 text-xs leading-relaxed text-brand-muted">
        <span aria-hidden="true" className="mr-1">
          🔒
        </span>
        Payment is held in escrow via Stripe and released to your pro only after you
        confirm the job is done.
      </p>

      {bannerError && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
        >
          {bannerError}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        aria-busy={isSubmitting || undefined}
        className={cn(
          "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors",
          canSubmit && !isSubmitting
            ? "bg-brand-primary text-white hover:bg-brand-primaryHover"
            : "cursor-not-allowed bg-brand-borderLight text-brand-muted",
        )}
      >
        {isSubmitting ? "Submitting…" : "Continue to payment →"}
      </button>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-brand-muted">{label}</dt>
      <dd className="text-right font-medium text-brand-logo">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const local = new Date(y, m - 1, d, 12);
  return DATE_FORMATTER.format(local);
}

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  const label = Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
  return `${label} ${rounded === 1 ? "hour" : "hours"}`;
}
