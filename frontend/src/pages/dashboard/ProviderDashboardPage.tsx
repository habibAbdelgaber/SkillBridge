import { useEffect, useMemo, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { NewJobRequests } from "@/components/dashboard/NewJobRequests";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodaysSchedule } from "@/components/dashboard/TodaysSchedule";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  DASHBOARD_STUBS,
  loadProviderDashboard,
} from "@/services/providerDashboardService";
import { useAuthStore } from "@/store/authStore";
import type { ProviderDashboardSnapshot } from "@/types/providerDashboard";
import { cn } from "@/utils/cn";

const SCHEDULE_RANGE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const CURRENCY_PRECISE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ProviderDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [snapshot, setSnapshot] = useState<ProviderDashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busyDecisions, setBusyDecisions] = useState<Set<string>>(new Set());
  const [payoutBusy, setPayoutBusy] = useState<boolean>(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    loadProviderDashboard({ user, now: today })
      .then((result) => {
        if (!cancelled) setSnapshot(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, today]);

  if (!user || !user.provider_profile) {
    return (
      <div className="min-h-screen bg-brand-background p-10">
        <ErrorState
          title="Provider account required"
          description="Sign in with a provider account to access this dashboard."
        />
      </div>
    );
  }

  const initials = computeInitials(`${user.first_name} ${user.last_name}`);

  async function handleDecision(bookingId: string, decision: "accept" | "decline") {
    setBusyDecisions((prev) => {
      const next = new Set(prev);
      next.add(bookingId);
      return next;
    });
    try {
      await DASHBOARD_STUBS.respondToRequest(bookingId, decision);
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingRequests: prev.pendingRequests.filter(
            (r) => r.bookingId !== bookingId,
          ),
        };
      });
    } finally {
      setBusyDecisions((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  }

  async function handleRequestPayout() {
    if (!snapshot || payoutBusy || snapshot.stats.pendingPayout <= 0) return;
    setPayoutBusy(true);
    setPayoutMessage(null);
    try {
      await DASHBOARD_STUBS.requestPayout(snapshot.stats.pendingPayout);
      setPayoutMessage(
        `Payout request received — ${CURRENCY_PRECISE.format(
          snapshot.stats.pendingPayout,
        )} will land on ${snapshot.stats.nextPayoutLabel}.`,
      );
    } catch (err) {
      setPayoutMessage(err instanceof Error ? err.message : "Couldn't request payout.");
    } finally {
      setPayoutBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-background">
      <DashboardSidebar
        user={user}
        initials={initials}
        variant="provider"
        className="sticky top-0 hidden h-screen w-60 lg:flex"
      />

      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        {isLoading && <LoadingState variant="profile" label="Loading dashboard…" />}

        {!isLoading && error && (
          <ErrorState
            title="Couldn't load dashboard"
            description={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !error && snapshot && (
          <DashboardBody
            snapshot={snapshot}
            today={today}
            busyDecisions={busyDecisions}
            payoutBusy={payoutBusy}
            payoutMessage={payoutMessage}
            onDecision={handleDecision}
            onRequestPayout={handleRequestPayout}
          />
        )}
      </main>
    </div>
  );
}

interface DashboardBodyProps {
  snapshot: ProviderDashboardSnapshot;
  today: Date;
  busyDecisions: Set<string>;
  payoutBusy: boolean;
  payoutMessage: string | null;
  onDecision: (id: string, decision: "accept" | "decline") => void;
  onRequestPayout: () => void;
}

function DashboardBody({
  snapshot,
  today,
  busyDecisions,
  payoutBusy,
  payoutMessage,
  onDecision,
  onRequestPayout,
}: DashboardBodyProps) {
  const { greeting, stats, schedule, earnings, reviews, pendingRequests } = snapshot;
  const totalEarnings30d = earnings.reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-logo sm:text-3xl">
            {greeting.timeOfDay}, {greeting.firstName}{" "}
            <span aria-hidden="true">✨</span>
          </h1>
          <p className="mt-1 text-sm text-brand-muted">{greeting.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              greeting.availableNow
                ? "bg-emerald-50 text-emerald-700"
                : "bg-brand-borderLight text-brand-muted",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                greeting.availableNow ? "bg-emerald-500" : "bg-brand-muted",
              )}
            />
            {greeting.availableNow ? "Available now" : "Off duty"}
          </span>
          <button
            type="button"
            onClick={onRequestPayout}
            disabled={payoutBusy || stats.pendingPayout <= 0}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors",
              payoutBusy || stats.pendingPayout <= 0
                ? "cursor-not-allowed bg-brand-primary/60"
                : "bg-brand-primary hover:bg-brand-primaryHover",
            )}
          >
            {payoutBusy ? "Submitting…" : "Request payout"}
          </button>
        </div>
      </header>

      {payoutMessage && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {payoutMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active jobs"
          value={stats.activeJobs}
          hint={`${stats.jobsToday} today · ${stats.jobsThisWeek} this week`}
        />
        <StatCard
          label="Pending payout"
          value={CURRENCY_PRECISE.format(stats.pendingPayout)}
          hint={`Next: ${stats.nextPayoutLabel}`}
        />
        <StatCard
          label="Earned this month"
          value={CURRENCY_PRECISE.format(stats.earnedThisMonth)}
          valueClassName="text-emerald-600"
          hint={
            <span
              className={cn(
                stats.earningsDeltaPct >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {stats.earningsDeltaPct >= 0 ? "+" : ""}
              {stats.earningsDeltaPct}% vs last month
            </span>
          }
        />
        <StatCard
          label="Response rate"
          value={`${stats.responseRatePct}%`}
          hint={`Avg reply ${stats.avgReplyLabel}`}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TodaysSchedule
          heading={`This week's schedule · ${weekRangeLabel(today)}`}
          entries={schedule}
          calendarHref="/dashboard/provider/calendar"
        />
        <EarningsChart
          heading="Earnings · last 30 days"
          total={totalEarnings30d}
          deltaPct={stats.earningsDeltaPct}
          buckets={earnings}
        />
      </div>

      {/* Keep cards sized to their own content instead of matching heights. */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <RecentReviews reviews={reviews} />
        <NewJobRequests
          requests={pendingRequests}
          onDecide={onDecision}
          busyIds={busyDecisions}
        />
      </div>
    </div>
  );
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return "SB";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function weekRangeLabel(today: Date): string {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6);
  return `${SCHEDULE_RANGE_FORMATTER.format(today)} – ${SCHEDULE_RANGE_FORMATTER.format(end)}`;
}

void CURRENCY;
