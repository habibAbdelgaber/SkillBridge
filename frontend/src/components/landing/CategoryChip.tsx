import { Link } from "react-router-dom";

interface CategoryChipProps {
  label: string;
  /** Slug used to filter the marketplace listing. */
  slug: string;
}

export function CategoryChip({ label, slug }: CategoryChipProps) {
  return (
    <Link
      to={`/marketplace?category=${encodeURIComponent(slug)}`}
      className="inline-flex items-center rounded-full border border-brand-borderLight bg-white px-3 py-1 text-xs font-medium text-brand-logo/80 transition-colors hover:border-brand-primary hover:text-brand-primary"
    >
      {label}
    </Link>
  );
}
