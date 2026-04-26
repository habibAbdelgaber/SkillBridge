import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

/**
 * Label + optional tag + hint + error wrapper used by every auth input.
 * Keeps the vertical rhythm and error styling consistent across forms.
 */
export function FormField({
  label,
  htmlFor,
  optional,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-medium text-brand-logo"
      >
        <span>{label}</span>
        {optional && (
          <span className="text-xs font-normal text-brand-muted">(optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-brand-muted">{hint}</p>
      ) : null}
    </div>
  );
}
