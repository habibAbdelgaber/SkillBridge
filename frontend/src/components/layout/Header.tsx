import { Link } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";

export function Header() {
  return (
    <header className="border-b border-brand-borderLight bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-brand-logo">
          <Logo className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">SkillBridge</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-brand-muted">
          <Link to="/" className="hover:text-brand-primaryHover">
            Home
          </Link>
          <a
            href="#"
            aria-disabled
            className="cursor-not-allowed opacity-60 hover:text-brand-muted"
          >
            Services
          </a>
          <a
            href="#"
            aria-disabled
            className="cursor-not-allowed opacity-60 hover:text-brand-muted"
          >
            Bookings
          </a>
        </nav>
      </div>
    </header>
  );
}
