import { cn } from "@/utils/cn";

interface RatingBadgeProps {
  average: number;
  count?: number;
  size?: "sm" | "md";
  variant?: "solid" | "inline";
  className?: string;
}

const SIZES: Record<NonNullable<RatingBadgeProps["size"]>, string> = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
};

const STAR_SIZES: Record<NonNullable<RatingBadgeProps["size"]>, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
};

export function RatingBadge({
  average,
  count,
  size = "sm",
  variant = "solid",
  className,
}: RatingBadgeProps) {
  const formatted = average.toFixed(1);

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold",
        variant === "solid"
          ? "rounded-full bg-amber-50 text-amber-700"
          : "text-brand-logo",
        SIZES[size],
        className,
      )}
      aria-label={`Rated ${formatted} out of 5${count != null ? ` from ${count} reviews` : ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("fill-amber-400 text-amber-400", STAR_SIZES[size])}
        aria-hidden="true"
      >
        <path d="M12 2.5l2.95 6.0 6.6.95-4.78 4.66 1.13 6.59L12 17.77l-5.9 3.1 1.13-6.59L2.45 9.45l6.6-.95L12 2.5z" />
      </svg>
      <span>{formatted}</span>
      {count != null && (
        <span
          className={cn(
            "font-normal",
            variant === "solid" ? "text-amber-700/70" : "text-brand-muted",
          )}
        >
          ({count})
        </span>
      )}
    </span>
  );
}
