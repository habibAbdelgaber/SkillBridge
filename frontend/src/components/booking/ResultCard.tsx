import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface ResultCardProps {
  tone: "success" | "error";
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ResultCard({
  tone,
  title,
  subtitle,
  children,
  actions,
  className,
}: ResultCardProps) {
  return (
    <article
      className={cn(
        "mx-auto w-full max-w-md rounded-xl border border-brand-borderLight bg-white p-8 shadow-card",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <ResultIcon tone={tone} />
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-logo sm:text-[26px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-muted">
            {subtitle}
          </p>
        )}
      </div>

      {children && <div className="mt-6">{children}</div>}

      {actions && <div className="mt-6 flex flex-col gap-2.5">{actions}</div>}
    </article>
  );
}

function ResultIcon({ tone }: { tone: "success" | "error" }) {
  if (tone === "success") {
    return (
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="h-7 w-7"
        >
          <path d="M5 12.5l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        className="h-7 w-7"
      >
        <path d="M12 8v5" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
