import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import type { Review } from "@/types/marketplace";
import { cn } from "@/utils/cn";

type ReviewSort = "recent" | "highest" | "lowest";

interface ReviewsCardProps {
  reviews: Review[];
  count: number;
  className?: string;
}

const SORT_LABEL: Record<ReviewSort, string> = {
  recent: "Most recent",
  highest: "Highest rated",
  lowest: "Lowest rated",
};

function Stars({ rating }: { rating: number }) {
  // Render five stars filled up to rating; non-decorative — the SR label
  // ("Rated X out of 5") is provided on the wrapping <span>.
  const value = Math.round(rating);
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className="inline-flex items-center gap-0.5 text-amber-400"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn("h-3.5 w-3.5", i >= value && "text-brand-borderLight")}
          aria-hidden="true"
        >
          <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

function sortReviews(reviews: Review[], sort: ReviewSort): Review[] {
  // Mock data is already chronologically ordered, so "recent" is identity.
  // Real implementation will move this to the backend.
  if (sort === "recent") return reviews;
  const copy = [...reviews];
  copy.sort((a, b) => (sort === "highest" ? b.rating - a.rating : a.rating - b.rating));
  return copy;
}

export function ReviewsCard({ reviews, count, className }: ReviewsCardProps) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const sorted = sortReviews(reviews, sort);

  return (
    <section
      aria-labelledby="reviews-heading"
      className={cn(
        "rounded-2xl border border-brand-borderLight bg-white p-6 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="reviews-heading" className="text-lg font-semibold text-brand-logo">
          Reviews ({count.toLocaleString()})
        </h2>

        <label className="inline-flex items-center gap-2 text-xs text-brand-muted">
          <span className="hidden sm:inline">Sort:</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ReviewSort)}
            className="rounded-md border-0 bg-transparent text-xs font-medium text-brand-logo focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            {(Object.keys(SORT_LABEL) as ReviewSort[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 bg-brand-surface/40 py-8"
          title="No reviews yet"
          description="Be the first customer to share feedback about this pro."
        />
      ) : (
        <ul className="mt-4 divide-y divide-brand-borderLight">
          {sorted.map((review) => (
            <li key={review.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-brand-logo">
                  {review.authorName}
                </span>
                <Stars rating={review.rating} />
                <span className="text-xs text-brand-muted">· {review.postedAgo}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
