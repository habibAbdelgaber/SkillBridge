import { cn } from "@/utils/cn";

interface TimeSlotPickerProps {
  heading?: string;
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
  emptyLabel?: string;
  className?: string;
}

export function TimeSlotPicker({
  heading,
  slots,
  selectedSlot,
  onSelect,
  emptyLabel = "No time slots available on this day.",
  className,
}: TimeSlotPickerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {heading && <p className="text-sm font-semibold text-brand-logo">{heading}</p>}

      {slots.length === 0 ? (
        <p className="text-sm text-brand-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const isActive = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelect(slot)}
                aria-pressed={isActive}
                className={cn(
                  "min-w-[72px] rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                    : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary hover:text-brand-primary",
                )}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
