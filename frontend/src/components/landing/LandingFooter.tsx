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
          <span className="ml-2 hidden text-xs text-white/60 sm:inline">
            · Built for people who get things done
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
