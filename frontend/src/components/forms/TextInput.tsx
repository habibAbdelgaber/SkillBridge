import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

/**
 * Text input styled to match the SkillBridge auth cards (white surface,
 * light border, focus ring in brand primary).
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, hasError, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-brand-logo",
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
    );
  },
);
