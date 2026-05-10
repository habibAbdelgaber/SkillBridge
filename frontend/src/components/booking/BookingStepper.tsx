import { cn } from "@/utils/cn";

export type BookingStep = "scope" | "schedule" | "payment" | "confirm";

interface BookingStepperProps {
  active: BookingStep;
  className?: string;
}

interface StepDef {
  id: BookingStep;
  label: string;
  index: number;
}

const STEPS: StepDef[] = [
  { id: "scope", label: "Scope", index: 1 },
  { id: "schedule", label: "Schedule", index: 2 },
  { id: "payment", label: "Payment", index: 3 },
  { id: "confirm", label: "Confirm", index: 4 },
];

export function BookingStepper({ active, className }: BookingStepperProps) {
  const activeIdx = STEPS.findIndex((s) => s.id === active);

  return (
    <ol
      aria-label="Booking progress"
      className={cn(
        "flex w-full items-center justify-center gap-2 sm:gap-4",
        className,
      )}
    >
      {STEPS.map((step, idx) => {
        const isActive = idx === activeIdx;
        const isComplete = idx < activeIdx;
        const isLast = idx === STEPS.length - 1;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isActive && "bg-brand-primary text-white",
                  isComplete && "bg-brand-primary text-white",
                  !isActive && !isComplete && "bg-brand-borderLight text-brand-muted",
                )}
              >
                {isComplete ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12.5l4 4 10-10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.index
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  isActive || isComplete ? "text-brand-logo" : "text-brand-muted",
                )}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                aria-hidden="true"
                className={cn(
                  "h-px flex-1 transition-colors",
                  isComplete ? "bg-brand-primary" : "bg-brand-borderLight",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
