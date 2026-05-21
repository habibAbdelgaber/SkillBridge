import { useMemo } from "react";

import { cn } from "@/utils/cn";

interface DateGridProps {
  visibleMonth: Date;
  slotsByDate: Map<string, number>;
  selectedDate: string | null;
  today: Date;
  onSelect: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  className?: string;
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

export function DateGrid({
  visibleMonth,
  slotsByDate,
  selectedDate,
  today,
  onSelect,
  onPrevMonth,
  onNextMonth,
  canGoPrev,
  canGoNext,
  className,
}: DateGridProps) {
  const weeks = useMemo(() => buildMonthMatrix(visibleMonth), [visibleMonth]);
  const monthLabel = MONTH_FORMATTER.format(visibleMonth);
  const todayKey = isoDateKey(today);

  return (
    <div
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-brand-logo">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={!canGoPrev}
            aria-label="Previous month"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border border-brand-borderLight text-brand-muted transition-colors",
              canGoPrev
                ? "hover:border-brand-primary hover:text-brand-primary"
                : "cursor-not-allowed opacity-40",
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
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={!canGoNext}
            aria-label="Next month"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border border-brand-borderLight text-brand-muted transition-colors",
              canGoNext
                ? "hover:border-brand-primary hover:text-brand-primary"
                : "cursor-not-allowed opacity-40",
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
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {weeks.flatMap((week) =>
          week.map((cell) => {
            if (!cell.inMonth) {
              return (
                <div
                  key={cell.iso}
                  aria-hidden="true"
                  className="h-12 rounded-md text-center text-xs text-brand-borderStrong/40"
                />
              );
            }
            const isSelected = selectedDate === cell.iso;
            const slots = slotsByDate.get(cell.iso) ?? 0;
            const isPast = cell.iso < todayKey;
            const isDisabled = isPast || slots === 0;
            const dayNumber = Number(cell.iso.slice(-2));

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => onSelect(cell.iso)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-label={`${cell.iso}${slots > 0 ? `, ${slots} slot${slots === 1 ? "" : "s"} available` : ", not available"}`}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  isSelected
                    ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                    : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary hover:text-brand-primary",
                  isDisabled &&
                    "cursor-not-allowed border-transparent bg-transparent text-brand-borderStrong/70 hover:border-transparent hover:text-brand-borderStrong/70",
                )}
              >
                <span>{dayNumber}</span>
                {!isDisabled && !isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1.5 h-1 w-1 rounded-full bg-brand-primary/70"
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

interface DayCell {
  iso: string;
  inMonth: boolean;
}

function buildMonthMatrix(reference: Date): DayCell[][] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  // Start on Monday to match the weekday header order.
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstWeekday);

  const weeks: DayCell[][] = [];
  for (let w = 0; w < 6; w += 1) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const cursor = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + w * 7 + d,
      );
      week.push({
        iso: isoDateKey(cursor),
        inMonth: cursor.getMonth() === month,
      });
    }
    weeks.push(week);
  }
  // Drop trailing placeholder-only weeks.
  if (weeks[5]?.every((c) => !c.inMonth)) weeks.pop();
  return weeks;
}

function isoDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
