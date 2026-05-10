import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: "default" | "surface" | "dark";
  as?: "section" | "div";
  innerClassName?: string;
  children: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-transparent",
  surface: "bg-brand-surface/40",
  dark: "bg-brand-logo text-white",
};

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
        className={cn("mx-auto w-full max-w-6xl px-6 py-14 sm:py-20", innerClassName)}
      >
        {children}
      </div>
    </Tag>
  );
}
