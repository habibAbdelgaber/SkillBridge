import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import type { AvailabilityDay } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface AvailabilityCardProps {
  days: AvailabilityDay[];
  /** Fired when the user clicks "Continue to booking" with a slot selected. */
  onContinue?: (slot: { date: string; time: string }) => void;
  className?: string;
}

/**
 * "Availability this week" sidebar card.
 *
 * Two-step picker: pick a day, then a time slot. The "Continue to
 * booking" CTA is disabled until both are chosen, then forwards the
 * selection to the parent for navigation into the booking flow. Stays
 * self-contained — no portal, no popover.
 */
export function AvailabilityCard({ days, onContinue, className }: AvailabilityCardProps) {
  const firstAvailableIdx = days.findIndex((day) => day.slots.length > 0);
  const [activeIdx, setActiveIdx] = useState<number>(
    firstAvailableIdx >= 0 ? firstAvailableIdx : 0,
  );
  const [activeTime, setActiveTime] = useState<string | null>(null);
  const activeDay = days[activeIdx];

  // Reset the time when the day changes so a stale slot from another day
  // can't be submitted.
  const selectDay = (idx: number) => {
    setActiveIdx(idx);
    setActiveTime(null);
  };

  const canContinue = Boolean(activeDay && activeTime);

  return (
    <section
      aria-labelledby="availability-heading"
      className={cn(
        "rounded-2xl border border-brand-borderLight bg-white p-6 shadow-card",
        className,
      )}
    >
      <h2 id="availability-heading" className="text-base font-semibold text-brand-logo">
        Availability this week
      </h2>

      {days.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 bg-brand-surface/40 py-8"
          title="No upcoming availability"
          description="Send a message to ask about custom dates."
        />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Choose a day"
            className="mt-4 grid grid-cols-7 gap-1.5"
          >
            {days.map((day, idx) => {
              const isActive = idx === activeIdx;
              const hasSlots = day.slots.length > 0;
              return (
                <button
                  key={day.date}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={!hasSlots}
                  onClick={() => selectDay(idx)}
                  className={cn(
                    "flex flex-col items-center rounded-md border px-1 py-1.5 font-medium transition-colors",
                    isActive
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary",
                    !hasSlots && "cursor-not-allowed opacity-40 hover:border-brand-borderLight",
                  )}
                >
                  <span className="text-[9px] uppercase tracking-wide">
                    {day.weekdayShort}
                  </span>
                  <span className="mt-0.5 text-sm font-bold">{day.dayOfMonth}</span>
                </button>
              );
            })}
          </div>

          {activeDay && (
            <p className="mt-5 text-xs text-brand-muted">
              Available slots ·{" "}
              <span className="text-brand-logo">
                {activeDay.weekdayShort} {activeDay.dayOfMonth}
              </span>
            </p>
          )}

          <div className="mt-2">
            {activeDay && activeDay.slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {activeDay.slots.map((time) => {
                  const isActive = activeTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveTime(time)}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-brand-primary bg-brand-primary text-white"
                          : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary hover:bg-brand-surface",
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-brand-muted">No slots available on this day.</p>
            )}
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => {
              if (activeDay && activeTime) {
                onContinue?.({ date: activeDay.date, time: activeTime });
              }
            }}
            className={cn(
              "mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors",
              canContinue
                ? "bg-brand-primary text-white hover:bg-brand-primaryHover"
                : "cursor-not-allowed bg-brand-borderLight text-brand-muted",
            )}
          >
            Continue to booking
          </button>
        </>
      )}
    </section>
  );
}
