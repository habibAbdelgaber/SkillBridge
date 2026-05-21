import { forwardRef, useState, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  hasError?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, hasError, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "w-full rounded-lg border bg-white px-3.5 py-2.5 pr-12 text-sm text-brand-logo",
            "placeholder:text-brand-muted/70",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0",
            hasError
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
              : "border-brand-borderLight focus:border-brand-primary focus:ring-brand-borderStrong",
            props.disabled && "cursor-not-allowed bg-brand-surface/30 text-brand-muted",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold uppercase tracking-wide text-brand-muted hover:text-brand-primary"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    );
  },
);
