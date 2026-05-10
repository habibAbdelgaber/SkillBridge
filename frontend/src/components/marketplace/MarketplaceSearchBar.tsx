import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

interface MarketplaceSearchBarProps {
  value: string;
  onChange: (next: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
}

export function MarketplaceSearchBar({
  value,
  onChange,
  debounceMs = 250,
  placeholder = "Search services or providers",
  className,
}: MarketplaceSearchBarProps) {
  const [internal, setInternal] = useState<string>(value);

  // Keep local state in sync when the parent resets filters.
  useEffect(() => {
    setInternal(value);
  }, [value]);

  useEffect(() => {
    if (internal === value) return;
    const handle = window.setTimeout(() => onChange(internal), debounceMs);
    return () => window.clearTimeout(handle);
  }, [internal, value, debounceMs, onChange]);

  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-lg border border-brand-borderLight bg-white px-4 py-2.5 shadow-card focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="h-5 w-5 text-brand-muted"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search services or providers"
        className="w-full bg-transparent text-sm text-brand-logo placeholder:text-brand-muted focus:outline-none focus:ring-0"
      />
      {internal && (
        <button
          type="button"
          onClick={() => setInternal("")}
          className="rounded-full p-1 text-brand-muted hover:bg-brand-surface hover:text-brand-logo"
          aria-label="Clear search"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-3.5 w-3.5"
          >
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </label>
  );
}
