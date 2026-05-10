import { cn } from "@/utils/cn";
import type { Category } from "@/types/marketplace";

interface CategoryChipsProps {
  categories: Category[];
  active: string | null;
  onChange: (slug: string | null) => void;
  className?: string;
}

export function CategoryChips({
  categories,
  active,
  onChange,
  className,
}: CategoryChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Service categories"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {categories.map((category) => {
        const isActive =
          category.slug === "all"
            ? active === null || active === "all"
            : active === category.slug;

        return (
          <button
            key={category.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category.slug === "all" ? null : category.slug)}
            className={cn(
              "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-brand-primary bg-brand-primary text-white shadow-sm hover:bg-brand-primaryHover"
                : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary hover:text-brand-primary",
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
