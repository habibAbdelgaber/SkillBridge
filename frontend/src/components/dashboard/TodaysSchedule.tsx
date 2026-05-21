import { Link } from "react-router-dom";

import type { ScheduleEntry, ScheduleStatus } from "@/types/providerDashboard";
import { cn } from "@/utils/cn";

interface TodaysScheduleProps {
  heading: string;
  entries: ScheduleEntry[];
  calendarHref: string;
  className?: string;
}

const STATUS_TONE: Record<ScheduleStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-sky-50 text-sky-700",
  tentative: "bg-amber-50 text-amber-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  completed: "Completed",
  upcoming: "Upcoming",
  tentative: "Tentative",
  cancelled: "Cancelled",
};

const ACCENT_TONE: Record<ScheduleStatus, string> = {
  completed: "bg-emerald-500",
  upcoming: "bg-brand-primary",
  tentative: "bg-amber-500",
  cancelled: "bg-rose-500",
};

export function TodaysSchedule({
  heading,
  entries,
  calendarHref,
  className,
}: TodaysScheduleProps) {
  return (
    <section
      aria-labelledby="schedule-heading"
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h2 id="schedule-heading" className="text-sm font-semibold text-brand-logo">
          {heading}
        </h2>
        <Link
          to={calendarHref}
          className="text-xs font-semibold text-brand-primary hover:text-brand-primaryHover"
        >
          Open calendar →
        </Link>
      </header>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-md bg-brand-surface/40 px-4 py-6 text-center text-sm text-brand-muted">
          Nothing on the calendar in the next 7 days.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.bookingId}
              className="flex items-center gap-3 rounded-md bg-brand-surface/30 px-3 py-2.5"
            >
              <div className="flex w-20 shrink-0 flex-col text-xs">
                <span
                  className={cn(
                    "inline-block w-fit rounded-sm px-2 py-0.5 text-[11px] font-semibold",
                    entry.dayLabel === "Today"
                      ? "bg-brand-primary text-white"
                      : "bg-white text-brand-logo ring-1 ring-brand-borderLight",
                  )}
                >
                  {entry.dayLabel}
                </span>
                <span className="mt-1 text-sm font-bold text-brand-logo">
                  {entry.startTime}
                </span>
                <span className="text-[11px] text-brand-muted">
                  {entry.durationLabel}
                </span>
              </div>
              <span
                aria-hidden="true"
                className={cn(
                  "h-12 w-1 shrink-0 rounded-full",
                  ACCENT_TONE[entry.status],
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-logo">
                  {entry.serviceTitle}
                </p>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{entry.meta}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  STATUS_TONE[entry.status],
                )}
              >
                {STATUS_LABEL[entry.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
