import { Fragment } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/utils/cn";

export interface BreadcrumbItem {
  label: string;
  /** When present, the item renders as a link; otherwise as the active leaf. */
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /**
   * Visual treatment.
   * - `default` — dark text on a light page (the marketplace surface, etc.).
   * - `light`   — light text for use on a dark / gradient hero band.
   */
  tone?: "default" | "light";
  className?: string;
}

interface ToneStyle {
  list: string;
  link: string;
  active: string;
  separator: string;
}

const TONE_STYLES: Record<NonNullable<BreadcrumbProps["tone"]>, ToneStyle> = {
  default: {
    list: "text-brand-muted",
    link: "font-medium text-brand-muted hover:text-brand-primary",
    active: "font-semibold text-brand-logo",
    separator: "text-brand-borderStrong",
  },
  light: {
    list: "text-white/70",
    link: "font-medium text-white/70 hover:text-white",
    active: "font-semibold text-white",
    separator: "text-white/40",
  },
};

/**
 * Lightweight breadcrumb trail.
 *
 * Marks the last item as `aria-current="page"` so screen readers and
 * style sheets can identify the active leaf without extra props. Pass
 * `tone="light"` when rendering on the navy gradient hero band so the
 * trail stays legible without overriding individual classes.
 */
export function Breadcrumb({ items, tone = "default", className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const styles = TONE_STYLES[tone];

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className={cn("flex flex-wrap items-center gap-1.5", styles.list)}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li>
                {item.to && !isLast ? (
                  <Link to={item.to} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(isLast && styles.active)}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className={styles.separator}>
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
