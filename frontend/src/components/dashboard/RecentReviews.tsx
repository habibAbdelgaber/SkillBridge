import type { Review } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface RecentReviewsProps {
  reviews: Review[];
  className?: string;
}

/**
 * Recent reviews card shown on the dashboard.
 *
 * Compact rows with: customer name + ★ rating + posted-ago, then the
 * review body on a second line. No avatar circles in the comp.
 */
export function RecentReviews({ reviews, className }: RecentReviewsProps) {
  return (
    <section
      aria-labelledby="recent-reviews-heading"
      className={cn(
        "rounded-xl border border-brand-borderLight bg-white p-5",
        className,
      )}
    >
      <h2 id="recent-reviews-heading" className="text-sm font-semibold text-brand-logo">
        Recent reviews
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-md bg-brand-surface/40 px-4 py-6 text-center text-sm text-brand-muted">
          No reviews yet — they'll show up here once your first job lands.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-brand-borderLight/80">
          {reviews.map((review) => (
            <li key={review.id} className="py-3 first:pt-0 last:pb-0">
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-brand-logo">
                <span className="font-semibold">{review.authorName}</span>
                <Stars value={review.rating} />
                <span className="text-xs text-brand-muted">· {review.postedAgo}</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex" aria-label={`${safe} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn(
            "h-3.5 w-3.5",
            idx < safe ? "text-amber-400" : "text-brand-borderStrong/30",
          )}
          aria-hidden="true"
        >
          <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
