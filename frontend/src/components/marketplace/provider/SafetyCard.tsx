import type { ProviderDetail } from "@/types/marketplace";
import { cn } from "@/utils/cn";

interface SafetyCardProps {
  /** Provider verification flags; if omitted the static defaults render. */
  verifications?: ProviderDetail["verifications"];
  className?: string;
}

interface SafetyItem {
  key: string;
  label: string;
}

/**
 * Resolve the checklist shown to the customer.
 *
 * The first three items are conditional on the provider's verification
 * flags so we don't claim a guarantee that isn't actually backed by the
 * backend. "Payment secured via Stripe" is platform-wide and always on.
 */
function buildItems(flags: ProviderDetail["verifications"] | undefined): SafetyItem[] {
  const items: SafetyItem[] = [];
  if (flags?.includes("id")) {
    items.push({ key: "id", label: "ID verified by SkillBridge" });
  }
  if (flags?.includes("background")) {
    items.push({ key: "background", label: "Background check passed" });
  }
  if (flags?.includes("insured")) {
    items.push({ key: "insured", label: "Insured up to $500,000" });
  }
  items.push({ key: "stripe", label: "Payment secured via Stripe" });
  return items;
}

export function SafetyCard({ verifications, className }: SafetyCardProps) {
  const items = buildItems(verifications);

  return (
    <section
      aria-labelledby="safety-heading"
      className={cn(
        "rounded-2xl border border-sky-100 bg-sky-50/60 p-6",
        className,
      )}
    >
      <h2 id="safety-heading" className="text-base font-semibold text-brand-logo">
        Safety & trust
      </h2>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-2 text-sm text-brand-logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            >
              <path d="M5 12.5l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
