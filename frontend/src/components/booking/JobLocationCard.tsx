import { cn } from "@/utils/cn";

interface JobLocationCardProps {
  address: string;
  notes: string;
  onAddressChange: (next: string) => void;
  onNotesChange: (next: string) => void;
  addressError?: string;
  className?: string;
}

export function JobLocationCard({
  address,
  notes,
  onAddressChange,
  onNotesChange,
  addressError,
  className,
}: JobLocationCardProps) {
  return (
    <section
      aria-labelledby="booking-location-heading"
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <h3
        id="booking-location-heading"
        className="text-base font-semibold text-brand-logo"
      >
        Job location & notes
      </h3>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="booking-address"
            className={cn(
              "flex items-center gap-2 rounded-md border bg-white px-3 py-2.5 transition-colors focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20",
              addressError ? "border-rose-300" : "border-brand-borderLight",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="h-4 w-4 shrink-0 text-rose-500"
              aria-hidden="true"
            >
              <path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <input
              id="booking-address"
              type="text"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="Job address (street, apt, city)"
              className="w-full bg-transparent text-sm text-brand-logo placeholder:text-brand-muted focus:outline-none"
              autoComplete="street-address"
              required
            />
          </label>
          {addressError && <p className="mt-1 text-xs text-rose-600">{addressError}</p>}
        </div>

        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notes for the pro (optional)"
          rows={3}
          className="w-full resize-y rounded-md border border-brand-borderLight bg-white px-3 py-2.5 text-sm text-brand-logo placeholder:text-brand-muted transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
    </section>
  );
}
