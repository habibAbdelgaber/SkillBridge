import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface TextareaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  function TextareaInput({ className, hasError, ...props }, ref) {
    return (
      <textarea
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
