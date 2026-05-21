import { cn } from "@/utils/cn";
import type {
  AvailabilityWindow,
  MarketplaceFilters,
  PriceBucket,
  RatingFloor,
  VerificationFlag,
} from "@/types/marketplace";

interface FilterPanelProps {
  filters: MarketplaceFilters;
  onChange: (next: MarketplaceFilters) => void;
  onReset: () => void;
  className?: string;
}

const AVAILABILITY: Array<{ value: AvailabilityWindow; label: string }> = [
  { value: "today", label: "Today" },
  { value: "this-week", label: "This week" },
  { value: "next-week", label: "Next week" },
];

const RATINGS: Array<{ value: RatingFloor; label: string }> = [
  { value: 4.5, label: "4.5+" },
  { value: 4.0, label: "4.0+" },
  { value: 0, label: "Any" },
];

const PRICES: Array<{ value: PriceBucket; label: string }> = [
  { value: "under-50", label: "Under $50" },
  { value: "50-100", label: "$50 – $100" },
  { value: "100-plus", label: "$100+" },
];

const VERIFICATIONS: Array<{ value: VerificationFlag; label: string }> = [
  { value: "id", label: "ID verified" },
  { value: "insured", label: "Insured" },
  { value: "background", label: "Background check" },
];

interface RadioRowProps<T extends string | number> {
  label: string;
  options: Array<{ value: T; label: string }>;
  active: T | null;
  onSelect: (value: T | null) => void;
}

function RadioRow<T extends string | number>({
  label,
  options,
  active,
  onSelect,
}: RadioRowProps<T>) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = active === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onSelect(isActive ? null : opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  className,
}: FilterPanelProps) {
  const toggleVerification = (flag: VerificationFlag) => {
    const has = filters.verifications.includes(flag);
    onChange({
      ...filters,
      verifications: has
        ? filters.verifications.filter((v) => v !== flag)
        : [...filters.verifications, flag],
    });
  };

  return (
    <aside
      className={cn(
        "rounded-2xl border border-brand-borderLight bg-white p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-logo">Filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-brand-primary hover:text-brand-primaryHover"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <RadioRow
          label="Availability"
          options={AVAILABILITY}
          active={filters.availability}
          onSelect={(value) => onChange({ ...filters, availability: value })}
        />
        <RadioRow
          label="Rating"
          options={RATINGS}
          active={filters.rating}
          onSelect={(value) => onChange({ ...filters, rating: value })}
        />
        <RadioRow
          label="Price"
          options={PRICES}
          active={filters.price}
          onSelect={(value) => onChange({ ...filters, price: value })}
        />

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Verifications
          </h4>
          <div className="mt-2 space-y-1.5">
            {VERIFICATIONS.map((opt) => {
              const checked = filters.verifications.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-brand-logo"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVerification(opt.value)}
                    className="h-4 w-4 rounded border-brand-borderStrong text-brand-primary focus:ring-brand-primary"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
