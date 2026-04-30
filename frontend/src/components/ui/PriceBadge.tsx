import { cn } from "@/utils/cn";

interface PriceBadgeProps {
  /** Hourly rate in whole dollars. Mutually exclusive with `flat`. */
  hourly?: number;
  /** Flat one-shot price. Mutually exclusive with `hourly`. */
  flat?: number;
  /** Visual scale. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<NonNullable<PriceBadgeProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

/**
 * "From $89/hr" or "$220 flat" pricing label.
 *
 * Renders nothing if both `hourly` and `flat` are missing — keeps callers
 * from having to gate on the presence of pricing data.
 */
export function PriceBadge({ hourly, flat, size = "md", className }: PriceBadgeProps) {
  if (hourly == null && flat == null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 font-semibold text-brand-logo",
        SIZES[size],
        className,
      )}
    >
      {hourly != null ? (
        <>
          <span className="text-xs font-medium text-brand-muted">From</span>
          <span>${hourly}</span>
          <span className="text-xs font-medium text-brand-muted">/hr</span>
        </>
      ) : (
        <>
          <span>${flat}</span>
          <span className="text-xs font-medium text-brand-muted">flat</span>
        </>
      )}
    </span>
  );
}
