import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SearchIcon } from "@/components/landing/icons";

interface SearchBarProps {
  /** Optional override for where the form posts to. Defaults to /marketplace. */
  destination?: string;
  placeholder?: string;
}

/**
 * Hero search input. Submits to the marketplace route as a query string
 * so the marketplace page (when it lands) can read `?q=` directly.
 */
export function SearchBar({
  destination = "/marketplace",
  placeholder = "Search for a service…",
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `${destination}?q=${encodeURIComponent(q)}` : destination);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full items-center gap-2 rounded-xl border border-brand-borderLight bg-white p-2 shadow-card focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20"
      role="search"
    >
      <SearchIcon className="ml-2 h-5 w-5 shrink-0 text-brand-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search for a service"
        className="flex-1 bg-transparent px-1 text-sm text-brand-logo placeholder:text-brand-muted/80 focus:outline-none"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryHover"
      >
        Search
      </button>
    </form>
  );
}
