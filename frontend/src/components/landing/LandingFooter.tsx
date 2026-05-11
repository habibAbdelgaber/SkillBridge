import { Link } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Support", href: "#support" },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-borderLight bg-brand-logo text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <Logo className="h-6 w-6" />
          <span className="text-base font-semibold tracking-tight">SkillBridge</span>
          <span className="ml-2 hidden items-center gap-1.5 text-xs text-white/60 sm:inline-flex">
            <span aria-hidden="true">·</span>
            <span>Built for people who get things done</span>
            <ClockIcon className="h-3.5 w-3.5" />
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-white/80">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-white">
              {l.label}
            </a>
          ))}
          <span className="text-white/60">&copy; {year}</span>
        </nav>
      </div>
    </footer>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
