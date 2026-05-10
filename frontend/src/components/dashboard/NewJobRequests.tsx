import type { JobRequestEntry } from "@/types/providerDashboard";
import { cn } from "@/utils/cn";

interface NewJobRequestsProps {
  requests: JobRequestEntry[];
  onDecide?: (bookingId: string, decision: "accept" | "decline") => void;
  busyIds?: Set<string>;
  className?: string;
}

export function NewJobRequests({
  requests,
  onDecide,
  busyIds,
  className,
}: NewJobRequestsProps) {
  return (
    <section
      aria-labelledby="job-requests-heading"
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h2 id="job-requests-heading" className="text-sm font-semibold text-brand-logo">
          New job requests
        </h2>
        {requests.length > 0 && (
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
            {requests.length} pending
          </span>
        )}
      </header>

      {requests.length === 0 ? (
        <p className="mt-6 rounded-md bg-brand-surface/40 px-4 py-6 text-center text-sm text-brand-muted">
          No pending requests. You're all caught up.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {requests.map((req) => {
            const isBusy = busyIds?.has(req.bookingId) ?? false;
            return (
              <li
                key={req.bookingId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-brand-surface/30 px-3 py-2.5 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-logo">
                    {req.customerLabel} · {req.serviceTitle}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-brand-muted">{req.meta}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDecide?.(req.bookingId, "decline")}
                    disabled={isBusy || !onDecide}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md border border-brand-borderLight bg-white px-3 py-1.5 text-xs font-semibold text-brand-logo transition-colors",
                      !isBusy && onDecide
                        ? "hover:border-rose-300 hover:text-rose-600"
                        : "cursor-not-allowed opacity-60",
                    )}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecide?.(req.bookingId, "accept")}
                    disabled={isBusy || !onDecide}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors",
                      !isBusy && onDecide
                        ? "bg-brand-primary hover:bg-brand-primaryHover"
                        : "cursor-not-allowed bg-brand-primary/60",
                    )}
                  >
                    {isBusy ? "…" : "Accept"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
