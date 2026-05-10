import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, id, ...props },
  ref,
) {
  const inputId =
    id ??
    (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm text-brand-logo",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-borderStrong text-brand-primary focus:ring-brand-borderStrong"
        {...props}
      />
      <span className="flex flex-col gap-1">
        <span className="font-medium leading-5">{label}</span>
        {description && (
          <span className="text-xs leading-relaxed text-brand-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
});
