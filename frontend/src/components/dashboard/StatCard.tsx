import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  valueClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "rounded-md border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <p className="text-[11px] font-medium text-brand-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-extrabold leading-none tracking-tight text-brand-logo",
          valueClassName,
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[11px] text-brand-muted">{hint}</p>}
    </article>
  );
}
