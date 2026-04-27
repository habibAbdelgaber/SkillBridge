import { Link } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";
import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";

export function Header() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="relative overflow-hidden border-b border-brand-borderLight bg-white/80 backdrop-blur">
      {/* Decorative SkillBridge motif - sits behind the nav, faded toward the
          left so it never competes with the logo or links. Hidden on small
          screens where the nav already fills the available width. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/3 bg-[url('/header-bg.svg')] bg-right bg-no-repeat md:block"
        style={{ backgroundSize: "auto 100%" }}
      />
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
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

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-brand-muted">
                {user?.email}
                {user?.role && (
                  <span className="ml-1 rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
                    {user.role}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-md border border-brand-borderLight px-3 py-1.5 text-xs font-semibold text-brand-logo hover:border-brand-borderStrong hover:text-brand-primary"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand-logo hover:text-brand-primary"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primaryHover hover:text-white"
              >
                Create account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
