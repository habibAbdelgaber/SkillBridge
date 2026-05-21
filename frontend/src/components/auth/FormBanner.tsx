import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type Tone = "error" | "success" | "info";

interface FormBannerProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-brand-borderLight bg-brand-surface/60 text-brand-logo",
};

export function FormBanner({ tone = "info", title, children }: FormBannerProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-3.5 py-3 text-sm",
        toneClasses[tone],
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
