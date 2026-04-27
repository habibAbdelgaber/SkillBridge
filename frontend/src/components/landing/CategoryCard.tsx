import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  label: string;
  slug: string;
  proCount: number;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const formatter = new Intl.NumberFormat("en-US");

export function CategoryCard({ label, slug, proCount, Icon }: CategoryCardProps) {
  return (
    <Link
      to={`/marketplace?category=${encodeURIComponent(slug)}`}
      className="group flex items-center gap-4 rounded-2xl border border-brand-borderLight bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-md"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-primary transition-colors group-hover:bg-brand-primary/15">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-logo">{label}</p>
        <p className="mt-0.5 text-xs text-brand-muted">
          {formatter.format(proCount)} pros
        </p>
      </div>
    </Link>
  );
}
