import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput({ className, hasError, options, placeholder, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-brand-logo",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0",
            hasError
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
              : "border-brand-borderLight focus:border-brand-primary focus:ring-brand-borderStrong",
            props.disabled && "cursor-not-allowed bg-brand-surface/30 text-brand-muted",
            !props.value && "text-brand-muted/70",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </div>
    );
  },
);
