import { CategoryChip } from "@/components/landing/CategoryChip";
import { ProviderPreviewCard } from "@/components/landing/ProviderPreviewCard";
import { SearchBar } from "@/components/landing/SearchBar";

const QUICK_FILTERS = [
  { label: "Plumbing", slug: "plumbing" },
  { label: "Cleaning", slug: "cleaning" },
  { label: "Tutoring", slug: "tutoring" },
  { label: "Design", slug: "design" },
  { label: "Handyman", slug: "handyman" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-surface to-brand-borderLight/70">
      {/* Soft accent blobs to give the diagonal gradient depth without
          competing with the foreground content. Pointer-events disabled so
          they never intercept clicks on the search bar or chips. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-brand-muted/15 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-12 sm:pt-16 lg:grid-cols-2 lg:gap-10 lg:pb-20 lg:pt-20">
        <div className="flex flex-col justify-start">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-borderLight bg-white px-3 py-1 text-xs font-semibold text-brand-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
            Trusted by 50,000+ customers
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-brand-logo sm:text-5xl lg:text-6xl">
            Find trusted professionals for every task.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
            Book plumbers, cleaners, tutors, designers, and more. <br className="hidden sm:block" />
            Pay securely through Stripe. Satisfaction guaranteed.
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBar />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((c) => (
              <CategoryChip key={c.slug} label={c.label} slug={c.slug} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <ProviderPreviewCard />
          </div>
        </div>
      </div>

      {/* Hero / Categories divider. Soft gradient hr fades into the page
          gutters so the seam reads as polish, not a hard cut. */}
      <div
        aria-hidden="true"
        className="relative mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-brand-borderStrong/60 to-transparent"
      />
    </section>
  );
}
