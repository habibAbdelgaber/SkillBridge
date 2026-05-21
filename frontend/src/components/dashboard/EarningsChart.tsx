import { useMemo } from "react";

import type { EarningsBucket } from "@/types/providerDashboard";
import { cn } from "@/utils/cn";

interface EarningsChartProps {
  heading: string;
  total: number;
  deltaPct: number;
  buckets: EarningsBucket[];
  className?: string;
}

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const SHORT_DATE = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

/** Lightweight 30-day earnings chart without an external chart library. */
export function EarningsChart({
  heading,
  total,
  deltaPct,
  buckets,
  className,
}: EarningsChartProps) {
  const max = useMemo(
    () => buckets.reduce((acc, b) => Math.max(acc, b.amount), 0),
    [buckets],
  );

  const ticks = useMemo(() => {
    if (buckets.length === 0) return [] as { label: string; index: number }[];
    const indexes = [
      0,
      Math.floor(buckets.length / 3),
      Math.floor((2 * buckets.length) / 3),
      buckets.length - 1,
    ];
    return indexes.map((idx) => {
      const date = new Date(`${buckets[idx]!.date}T00:00:00`);
      return {
        label: idx === buckets.length - 1 ? "Today" : SHORT_DATE.format(date),
        index: idx,
      };
    });
  }, [buckets]);

  const isPositive = deltaPct >= 0;

  return (
    <section
      aria-labelledby="earnings-chart-heading"
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <header>
        <h2
          id="earnings-chart-heading"
          className="text-sm font-semibold text-brand-logo"
        >
          {heading}
        </h2>
        <p className="mt-3 text-3xl font-bold text-brand-logo">
          {CURRENCY.format(total)}
        </p>
        <p
          className={cn(
            "mt-1 text-xs",
            isPositive ? "text-emerald-600" : "text-rose-600",
          )}
        >
          <span aria-hidden="true">{isPositive ? "↑" : "↓"}</span>{" "}
          <span className="font-semibold">{Math.abs(deltaPct)}%</span>{" "}
          <span className="text-brand-muted">vs last 30 days</span>
        </p>
      </header>

      <div className="mt-5">
        {buckets.length === 0 ? (
          <p className="rounded-md bg-brand-surface/40 px-4 py-6 text-center text-sm text-brand-muted">
            No earnings recorded in the last 30 days yet.
          </p>
        ) : (
          <Bars buckets={buckets} max={max} />
        )}

        {ticks.length > 0 && (
          <div className="mt-2 flex justify-between text-[11px] text-brand-muted">
            {ticks.map((tick, idx) => (
              <span key={`${tick.index}-${idx}`}>{tick.label}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface BarsProps {
  buckets: EarningsBucket[];
  max: number;
}

function Bars({ buckets, max }: BarsProps) {
  const lastIdx = buckets.length - 1;
  const minHeight = 4;
  return (
    <div className="flex h-32 items-end gap-[3px]">
      {buckets.map((bucket, idx) => {
        const ratio = max === 0 ? 0 : bucket.amount / max;
        const heightPct = Math.max(minHeight, Math.round(ratio * 100));
        const isToday = idx === lastIdx;
        return (
          <span
            key={bucket.date}
            title={`${bucket.date}: ${CURRENCY.format(bucket.amount)}`}
            className={cn(
              "flex-1 rounded-sm",
              isToday ? "bg-brand-primary" : "bg-sky-200",
            )}
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
}
