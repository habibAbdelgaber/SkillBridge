import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type Provider = "google" | "facebook";

interface SocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: Provider;
}

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M21.6 12.227c0-.8-.072-1.57-.207-2.31H12v4.368h5.377a4.6 4.6 0 0 1-1.992 3.018v2.504h3.222C20.48 18.04 21.6 15.395 21.6 12.227Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.964-.894 6.618-2.423l-3.222-2.504c-.894.6-2.037.956-3.396.956-2.612 0-4.823-1.763-5.613-4.134H3.047v2.584A9.998 9.998 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.387 13.895a6.008 6.008 0 0 1 0-3.789V7.52H3.047a10.01 10.01 0 0 0 0 8.96l3.34-2.585Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.977c1.47 0 2.79.506 3.83 1.498l2.859-2.859C16.96 2.991 14.695 2 12 2a9.998 9.998 0 0 0-8.953 5.52l3.34 2.585C7.177 7.74 9.388 5.977 12 5.977Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M22 12a10 10 0 1 0-11.563 9.877V14.89H7.898V12h2.539V9.797c0-2.507 1.493-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.461h-1.26c-1.242 0-1.629.771-1.629 1.562V12h2.773l-.443 2.89h-2.33v6.987A10.002 10.002 0 0 0 22 12Z" />
    </svg>
  );
}

export function SocialButton({ provider, className, ...props }: SocialButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-brand-borderLight bg-white px-4",
        "text-sm font-semibold text-brand-logo shadow-sm transition-colors",
        "hover:border-brand-borderStrong hover:bg-brand-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-borderStrong focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
      <span>{PROVIDER_LABELS[provider]}</span>
    </button>
  );
}
