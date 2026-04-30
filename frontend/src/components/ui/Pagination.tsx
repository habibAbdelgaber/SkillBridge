import { cn } from "@/utils/cn";

interface PaginationProps {
  /** 1-indexed current page. */
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
  /** Hide the pager entirely when there is only one page. Defaults to true. */
  hideWhenSingle?: boolean;
  /**
   * How many neighbouring page numbers to show on each side of the current
   * page. The first/last pages are always rendered, with ellipses inserted
   * when the gap is non-trivial. Defaults to 1.
   */
  siblingCount?: number;
  className?: string;
}

/**
 * Numbered pagination control.
 *
 * Renders Prev / 1 … N-1 N N+1 … Last / Next, with the active page styled
 * in the brand-primary fill. Uses a stable, deterministic page-number
 * sequence so the layout doesn't jump when `page` advances.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  hideWhenSingle = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && hideWhenSingle) return null;

  const pages = buildPageSequence(page, totalPages, siblingCount);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <PageButton
        label="Prev"
        ariaLabel="Previous page"
        disabled={!canPrev}
        onClick={() => canPrev && onChange(page - 1)}
      />

      {pages.map((entry, idx) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            aria-hidden="true"
            className="px-2 text-sm text-brand-muted"
          >
            …
          </span>
        ) : (
          <PageButton
            key={entry}
            label={String(entry)}
            ariaLabel={`Page ${entry}`}
            active={entry === page}
            onClick={() => onChange(entry)}
          />
        ),
      )}

      <PageButton
        label="Next"
        ariaLabel="Next page"
        disabled={!canNext}
        onClick={() => canNext && onChange(page + 1)}
      />
    </nav>
  );
}

interface PageButtonProps {
  label: string;
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function PageButton({ label, ariaLabel, active, disabled, onClick }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "min-w-[2.25rem] rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "border-brand-primary bg-brand-primary text-white shadow-sm"
          : "border-brand-borderLight bg-white text-brand-logo hover:border-brand-primary hover:text-brand-primary",
        disabled && "cursor-not-allowed opacity-40 hover:border-brand-borderLight hover:text-brand-logo",
      )}
    >
      {label}
    </button>
  );
}

type PageEntry = number | "ellipsis";

/**
 * Build the displayed page sequence.
 *
 * Always renders 1, the sibling window, and `totalPages`, with `"ellipsis"`
 * markers in the gaps. Keeps the rendered count stable so layout doesn't
 * shift as the user pages through.
 */
function buildPageSequence(
  current: number,
  total: number,
  siblings: number,
): PageEntry[] {
  if (total <= 1) return [1];

  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);

  const result: PageEntry[] = [1];
  if (start > 2) result.push("ellipsis");
  for (let i = start; i <= end; i += 1) result.push(i);
  if (end < total - 1) result.push("ellipsis");
  if (total > 1) result.push(total);

  return result;
}
