import { cn } from "@/utils/cn";

interface AboutCardProps {
  bio: string;
  className?: string;
}

/**
 * Plain "About" card on the provider profile.
 *
 * Location was previously rendered as a pill at the bottom; the design
 * surfaces location in the hero subtitle instead, so the bio is the only
 * content here. Keeps this card a single typographic block.
 */
export function AboutCard({ bio, className }: AboutCardProps) {
  return (
    <section
      aria-labelledby="about-heading"
      className={cn(
        "rounded-2xl border border-brand-borderLight bg-white p-6 shadow-card",
        className,
      )}
    >
      <h2 id="about-heading" className="text-lg font-semibold text-brand-logo">
        About
      </h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-muted">
        {bio}
      </p>
    </section>
  );
}
