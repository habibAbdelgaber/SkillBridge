import { ShieldCheckIcon, StarIcon } from "@/components/landing/icons";

/**
 * Decorative hero illustration: a soft rounded panel with two floating
 * mini-cards layered over it. Mirrors the right-hand visual in the Figma.
 *
 * The data is intentionally hard-coded — this is a marketing illustration,
 * not a live preview. When the real provider directory ships we can swap in
 * an actual record and add `aria-live` semantics; for now it's `aria-hidden`.
 */
export function ProviderPreviewCard() {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-surface via-brand-borderLight/40 to-white shadow-card sm:aspect-[5/6]">
      {/* Soft accent blob */}
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-primary/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-12 left-1/3 h-44 w-44 rounded-full bg-brand-muted/15 blur-3xl"
      />

      {/* Provider card */}
      <div className="absolute left-6 top-1/3 w-[68%] max-w-xs rounded-2xl border border-brand-borderLight bg-white/95 p-4 shadow-card backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-semibold text-brand-primary">
            JM
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-logo">John Martinez</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
              <StarIcon className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold text-brand-logo">4.9</span>
              <span>· 1,204 jobs</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-brand-muted">
          Available today · <span className="text-brand-logo">$89/hr</span>
        </p>
      </div>

      {/* Payment card */}
      <div className="absolute right-6 top-[42%] flex w-[58%] max-w-[14rem] items-start gap-2 rounded-2xl border border-brand-borderLight bg-white/95 p-3 shadow-card backdrop-blur">
        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <div>
          <p className="text-xs font-semibold text-brand-logo">Payment secured</p>
          <p className="mt-0.5 text-[11px] text-brand-muted">
            $134.50 held in escrow
          </p>
        </div>
      </div>
    </div>
  );
}
