import type { SortOption } from "@/types/marketplace";

interface SortDropdownProps {
  value: SortOption;
  onChange: (next: SortOption) => void;
  className?: string;
}

const OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "best-rated", label: "Best rated" },
  { value: "most-reviewed", label: "Most reviewed" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  return (
    <label className={className}>
      <span className="sr-only">Sort by</span>
      <div className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="appearance-none rounded-lg border border-brand-borderLight bg-white py-2 pl-4 pr-10 text-sm font-medium text-brand-logo shadow-sm transition-colors hover:border-brand-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="pointer-events-none absolute right-3 h-4 w-4 text-brand-muted"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}
