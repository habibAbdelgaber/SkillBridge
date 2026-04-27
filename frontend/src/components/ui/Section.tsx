import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Tone controls the section's background; the inner container width is constant. */
  tone?: "default" | "surface" | "dark";
  /** Renders the wrapper as `<section>` (default) or any other element. */
  as?: "section" | "div";
  /** Optional inner-container override; defaults to a 6xl max width with horizontal padding. */
  innerClassName?: string;
  children: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-transparent",
  surface: "bg-brand-surface/40",
  /** Matches the footer's deep-navy band so sections can bookend the page. */
  dark: "bg-brand-logo text-white",
};

/**
 * Marketing-page section wrapper.
 *
 * Provides consistent vertical rhythm and a max-width inner container so
 * each landing block aligns to the same horizontal grid as the navbar.
 */
export function Section({
  tone = "default",
  as: Tag = "section",
  className,
  innerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <Tag className={cn(TONE_CLASSES[tone], className)} {...rest}>
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-6 py-14 sm:py-20",
          innerClassName,
        )}
      >
        {children}
      </div>
    </Tag>
  );
}
