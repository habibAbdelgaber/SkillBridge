import { cn } from "@/utils/cn";

interface Step {
  label: string;
  state: "done" | "current" | "upcoming";
}

interface StepBreadcrumbProps {
  steps: Step[];
}

/** Simple numbered step indicator shown at the top of the provider flow. */
export function StepBreadcrumb({ steps }: StepBreadcrumbProps) {
  return (
    <ol className="flex items-center gap-3 text-xs font-medium">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-2",
              step.state === "current"
                ? "text-brand-logo"
                : step.state === "done"
                  ? "text-brand-primary"
                  : "text-brand-muted",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                step.state === "done" &&
                  "border-brand-primary bg-brand-primary text-white",
                step.state === "current" &&
                  "border-brand-primary bg-white text-brand-primary",
                step.state === "upcoming" &&
                  "border-brand-borderStrong bg-white text-brand-muted",
              )}
            >
              {step.state === "done" ? (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 6.3 5 8.8l4.5-5.3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <span className="h-px w-6 bg-brand-borderStrong" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}
