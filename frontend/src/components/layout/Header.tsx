import { Link, useNavigate } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";
import { LogoutIcon } from "@/components/ui/LogoutIcon";
import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

export function Header() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openAuthModal = useUIStore((s) => s.openAuthModal);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

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
              <Link
                to={
                  user?.role === "provider"
                    ? "/dashboard/provider"
                    : "/dashboard/customer"
                }
                title="Open my dashboard"
                className="inline-flex h-9 max-w-[190px] items-center rounded-md bg-brand-surface/70 px-3 text-xs font-medium text-brand-logo transition-colors hover:bg-brand-surface hover:text-brand-logo"
              >
                <span className="truncate">{user?.email}</span>
              </Link>
              {user?.role && (
                <Link
                  to={
                    user.role === "provider"
                      ? "/dashboard/provider"
                      : "/dashboard/customer"
                  }
                  title="Open my dashboard"
                  className="inline-flex h-9 items-center rounded-md bg-brand-surface/70 px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-primary transition-colors hover:bg-brand-surface hover:text-brand-primary"
                >
                  {user.role}
                </Link>
              )}
              <button
                type="button"
                aria-label="Sign out"
                title="Sign out"
                onClick={() => void handleLogout()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-surface/70 text-brand-logo transition-colors duration-150 hover:bg-red-400 hover:text-white"
              >
                <LogoutIcon />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primaryHover hover:text-white"
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
