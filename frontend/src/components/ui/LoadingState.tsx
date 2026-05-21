import { cn } from "@/utils/cn";

interface LoadingStateProps {
  variant?: "card-grid" | "profile" | "spinner";
  count?: number;
  className?: string;
  label?: string;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-brand-borderLight bg-white p-5 shadow-card">
      <div className="h-32 w-full rounded-xl bg-brand-surface" />
      <div className="mt-4 h-4 w-3/4 rounded bg-brand-surface" />
      <div className="mt-2 h-3 w-1/2 rounded bg-brand-surface" />
      <div className="mt-5 flex items-center justify-between">
        <div className="h-5 w-20 rounded-full bg-brand-surface" />
        <div className="h-5 w-16 rounded bg-brand-surface" />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 w-full rounded-2xl bg-brand-surface" />
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-brand-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-1/3 rounded bg-brand-surface" />
          <div className="h-4 w-1/2 rounded bg-brand-surface" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-2xl bg-brand-surface" />
        <div className="h-40 rounded-2xl bg-brand-surface" />
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-brand-muted">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 animate-spin text-brand-primary"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="42"
          strokeDashoffset="14"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingState({
  variant = "card-grid",
  count = 6,
  className,
  label = "Loading…",
}: LoadingStateProps) {
  if (variant === "spinner") {
    return (
      <div role="status" aria-live="polite" className={className}>
        <Spinner label={label} />
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div role="status" aria-live="polite" className={className}>
        <ProfileSkeleton />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
