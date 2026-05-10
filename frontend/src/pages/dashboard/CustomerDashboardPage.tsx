import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingBookingsCard } from "@/components/dashboard/UpcomingBookingsCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { loadCustomerDashboard } from "@/services/customerDashboardService";
import { useAuthStore } from "@/store/authStore";
import type { CustomerDashboardSnapshot } from "@/types/customerDashboard";
import { cn } from "@/utils/cn";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function CustomerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [snapshot, setSnapshot] = useState<CustomerDashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    loadCustomerDashboard({ user, now: today })
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

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-background p-10">
        <ErrorState
          title="Sign in required"
          description="Sign in to access your dashboard."
        />
      </div>
    );
  }

  const initials = computeInitials(`${user.first_name} ${user.last_name}`);

  return (
    <div className="min-h-screen bg-brand-background lg:flex">
      <DashboardSidebar
        user={user}
        initials={initials}
        variant="customer"
        className="w-full border-b border-brand-borderLight lg:sticky lg:top-0 lg:h-screen lg:w-[188px] lg:shrink-0 lg:border-b-0"
      />

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-8 lg:px-[30px] lg:py-6">
        {isLoading && <LoadingState variant="profile" label="Loading dashboard…" />}

        {!isLoading && error && (
          <ErrorState
            title="Couldn't load dashboard"
            description={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !error && snapshot && <Body snapshot={snapshot} />}
      </main>
    </div>
  );
}

interface BodyProps {
  snapshot: CustomerDashboardSnapshot;
}

function Body({ snapshot }: BodyProps) {
  const { greeting, stats, upcoming, activity } = snapshot;

  return (
    <div className="w-full space-y-3">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-logo sm:text-[22px]">
            Welcome back, {greeting.firstName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm leading-none text-brand-muted">
            {greeting.subtitle}
          </p>
        </div>
        <Link
          to="/marketplace"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-brand-primary px-4 text-xs font-bold text-white transition-colors hover:bg-brand-primaryHover hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New booking
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active bookings"
          value={stats.activeBookings}
          hint={`${stats.bookingsToday} today`}
          className="min-h-[88px] p-4"
        />
        <StatCard
          label="In escrow"
          value={CURRENCY.format(stats.inEscrow)}
          hint={`across ${stats.pendingCount + stats.bookingsThisWeek} jobs`}
          className="min-h-[88px] p-4"
        />
        <StatCard
          label="Jobs completed"
          value={stats.jobsCompleted}
          hint="this year"
          className="min-h-[88px] p-4"
        />
        <StatCard
          label="Average rating given"
          value={
            <span className="inline-flex items-baseline gap-1.5">
              {stats.averageRatingGiven.toFixed(1)}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 self-center text-amber-400"
                aria-hidden="true"
              >
                <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
              </svg>
            </span>
          }
          hint={`${stats.reviewsWritten} reviews`}
          className="min-h-[88px] p-4"
        />
      </div>

      <div
        className={cn(
          "grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.83fr)_minmax(0,1fr)]",
        )}
      >
        <UpcomingBookingsCard rows={upcoming} />
        <RecentActivityCard entries={activity} />
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
