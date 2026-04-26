import { Logo } from "@/components/ui/Logo";

const BENEFITS = [
  "Payments secured in escrow via Stripe",
  "Verified pros earn 3× more on average",
  "Typical onboarding: 3 minutes",
];

/**
 * The dark brand-blue left rail shown on the provider registration (step 2)
 * page. Mirrors the Figma hero closely (headline + benefits + earnings
 * callout), while reusing the existing brand palette.
 */
export function ProviderHeroPanel() {
  return (
    <aside className="hidden flex-col justify-between gap-10 bg-brand-logo px-10 py-12 text-white lg:flex lg:w-[420px] xl:w-[440px]">
      <div className="flex items-center gap-2">
        <Logo className="h-9 w-9" />
        <span className="text-lg font-semibold tracking-tight">SkillBridge</span>
      </div>

      <div className="flex flex-col gap-6">
        <span className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
          Step 2 of 2 · Business details
        </span>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Turn your skills
          <br />
          into income.
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-white/75">
          Tell us a bit about your business so we can match you with the right
          customers and set up secure payouts via Stripe.
        </p>

        <ul className="flex flex-col gap-2.5">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2.5 text-sm text-white/85">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <svg
                  className="h-3 w-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 6.3 5 8.8l4.5-5.3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-white/90 backdrop-blur-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white">$4,820</span>
          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
            +15%
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-white/65">
          Average monthly earnings for top providers in your category.
        </p>
      </div>
    </aside>
  );
}
