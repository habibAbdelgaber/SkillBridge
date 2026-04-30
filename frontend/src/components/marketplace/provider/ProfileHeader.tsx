import type { ProviderDetail } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface ProfileHeaderProps {
  provider: ProviderDetail;
  /** Right-aligned CTA cluster, stacked on >=sm. */
  cta?: React.ReactNode;
  className?: string;
}

/**
 * Provider hero band.
 *
 * Layout (matches the marketplace design system):
 *   [ solid blue banner             ]
 *   [JM]  John Martinez  [Verified pro]      [Primary CTA]
 *         tagline · location · response       [Secondary CTA]
 *         ★ rating · tenure · jobs
 *
 * - Avatar is a circle, overlaps the bottom of the banner.
 * - Verifications collapse into a single "Verified pro" pill; the full
 *   list is surfaced in `SafetyCard` so we don't double-state trust here.
 * - Stats render as a single inline row with subtle separators — the
 *   four-up grid was visually heavy and didn't match the comp.
 */
export function ProfileHeader({ provider, cta, className }: ProfileHeaderProps) {
  const isVerified = provider.verifications.length > 0;
  const tenureLabel = `${provider.yearsOnPlatform} ${
    provider.yearsOnPlatform === 1 ? "year" : "years"
  } on SkillBridge`;
  const reviewLabel = `${provider.rating.count.toLocaleString()} ${
    provider.rating.count === 1 ? "review" : "reviews"
  }`;
  const jobsLabel = `${provider.jobsCompleted.toLocaleString()} jobs completed`;
  const responseLabel =
    provider.responseTimeMinutes != null
      ? provider.responseTimeMinutes < 60
        ? `Replies in under ${provider.responseTimeMinutes} min`
        : `Replies in under ${Math.max(1, Math.round(provider.responseTimeMinutes / 60))} hour`
      : null;

  return (
    <header
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-borderLight bg-white shadow-card",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="h-32 bg-gradient-to-br from-sky-200 via-sky-300 to-sky-400 sm:h-40"
      />

      <div className="px-5 pb-6 sm:px-8 sm:pb-7">
        <div className="-mt-10 flex flex-col gap-8 sm:-mt-12 sm:gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-primary text-xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-2xl"
            >
              {provider.initials}
            </div>

            <div className="min-w-0 pt-10 sm:pt-12">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-brand-logo sm:text-3xl">
                  {provider.fullName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.25}
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path d="M5 12.5l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Verified pro
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-brand-muted sm:text-[15px]">
                {[provider.headline, provider.location, responseLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-brand-logo">
                <li className="inline-flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 text-amber-400"
                    aria-hidden="true"
                  >
                    <path d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z" />
                  </svg>
                  <span className="font-semibold">{provider.rating.average.toFixed(1)}</span>
                  <span className="text-brand-muted">{reviewLabel}</span>
                </li>
                <li className="inline-flex items-center gap-1.5 text-brand-muted">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {tenureLabel}
                </li>
                <li className="inline-flex items-center gap-1.5 text-brand-muted">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16v12H4z" />
                    <path d="M9 7V5h6v2" strokeLinecap="round" />
                  </svg>
                  {jobsLabel}
                </li>
              </ul>
            </div>
          </div>

          {cta && (
            <div className="flex flex-col items-stretch gap-3 sm:items-end lg:min-w-[240px] lg:pt-16">
              {cta}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
