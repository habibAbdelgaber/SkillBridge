import { cn } from "@/utils/cn";

type StatusTone = "ok" | "warn" | "error" | "neutral";

interface StatusBadgeProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warn: "bg-amber-50 text-amber-700 ring-amber-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
  neutral: "bg-brand-surface text-brand ring-brand-borderStrong",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "error" && "bg-rose-500",
          tone === "neutral" && "bg-brand-primary",
        )}
      />
      {children}
    </span>
  );
}
