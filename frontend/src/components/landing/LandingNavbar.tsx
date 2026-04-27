import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";
import { cn } from "@/utils/cn";

interface NavItem {
  label: string;
  to: string;
  /** Hash anchor on the landing page; we treat these as internal scroll targets. */
  hash?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Marketplace", to: "/marketplace" },
  { label: "How it works", to: "#how-it-works", hash: true },
  { label: "Become a pro", to: "/register/provider" },
  { label: "Support", to: "#support", hash: true },
];

/**
 * Marketing navbar. Distinct from the in-app `Header` so the public landing
 * page can present a different IA (Marketplace / How it works / Become a pro
 * / Support) without polluting the authenticated shell.
 */
export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-borderLight/60 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-brand-logo"
          onClick={() => setOpen(false)}
        >
          <Logo className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">SkillBridge</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-brand-logo/80 md:flex">
          {NAV_ITEMS.map((item) =>
            item.hash ? (
              <a
                key={item.label}
                href={item.to}
                className="transition-colors hover:text-brand-primary"
              >
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "transition-colors hover:text-brand-primary",
                    isActive && "text-brand-primary",
                  )
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-brand-logo transition-colors hover:text-brand-primary"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primaryHover hover:text-white"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-brand-borderLight text-brand-logo md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-brand-borderLight bg-white md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4 text-sm font-medium text-brand-logo">
            {NAV_ITEMS.map((item) =>
              item.hash ? (
                <a
                  key={item.label}
                  href={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 hover:bg-brand-surface/60"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 hover:bg-brand-surface/60"
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="mt-2 flex items-center gap-3 border-t border-brand-borderLight pt-3">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-brand-borderLight px-3 py-2 text-center font-semibold text-brand-logo"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md bg-brand-primary px-3 py-2 text-center font-semibold text-white hover:bg-brand-primaryHover hover:text-black"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
