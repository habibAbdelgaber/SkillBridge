import { cn } from "@/utils/cn";

interface PriceBadgeProps {
  hourly?: number;
  flat?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<NonNullable<PriceBadgeProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

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
