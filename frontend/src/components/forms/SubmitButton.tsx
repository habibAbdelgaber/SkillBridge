import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function SubmitButton({
  loading,
  loadingText = "Working…",
  disabled,
  className,
  children,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4",
        "text-sm font-semibold text-white shadow-sm transition-colors",
        "hover:bg-brand-primaryHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-borderStrong focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:bg-brand-primary/60",
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          aria-hidden="true"
          className="h-4 w-4 animate-spin text-white/90"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-25"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}
