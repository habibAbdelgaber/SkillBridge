import type { ActivityEntry, ActivityKind } from "@/types/customerDashboard";
import { cn } from "@/utils/cn";

interface RecentActivityCardProps {
  entries: ActivityEntry[];
  className?: string;
}

const TONE: Record<ActivityKind, string> = {
  "booking-created": "bg-sky-50 text-sky-600",
  "booking-confirmed": "bg-sky-100 text-brand-primary",
  "booking-cancelled": "bg-rose-50 text-rose-600",
  "payment-held": "bg-brand-surface text-brand-logo",
  message: "bg-brand-surface text-brand-muted",
  "review-submitted": "bg-sky-100 text-brand-primary",
  "review-window": "bg-amber-50 text-amber-600",
};

const ICON: Record<ActivityKind, JSX.Element> = {
  "booking-created": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  "booking-confirmed": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12.5l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "booking-cancelled": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
    </svg>
  ),
  "payment-held": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M4 10h16" strokeLinecap="round" />
    </svg>
  ),
  message: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "review-submitted": (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
    </svg>
  ),
  "review-window": (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
    </svg>
  ),
};

export function RecentActivityCard({ entries, className }: RecentActivityCardProps) {
  return (
    <section
      aria-labelledby="recent-activity-heading"
      className={cn(
        "flex flex-col rounded-md border border-brand-borderLight bg-white px-5 pt-4",
        className,
      )}
    >
      <h2 id="recent-activity-heading" className="text-base font-bold text-brand-logo">
        Recent activity
      </h2>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-md bg-brand-surface/40 px-4 py-6 text-center text-sm text-brand-muted">
          Nothing here yet. Activity shows up as soon as you book a service.
        </p>
      ) : (
        <ul className="mt-4 space-y-4 pb-4">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  TONE[entry.kind],
                )}
                aria-hidden="true"
              >
                {ICON[entry.kind]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-brand-logo">
                  {entry.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-brand-muted">
                  {entry.detail} · {entry.timeAgo}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
