import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";
import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/utils/cn";

interface NavItem {
  label: string;
  to: string;
  hash?: boolean;
  guestOnly?: boolean;
  authedOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/home", authedOnly: true },
  { label: "Marketplace", to: "/marketplace" },
  { label: "How it works", to: "#how-it-works", hash: true },
  { label: "Become a pro", to: "/register/provider", guestOnly: true },
  { label: "Support", to: "#support", hash: true },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openAuthModal = useUIStore((s) => s.openAuthModal);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.guestOnly && isAuthenticated) return false;
    if (item.authedOnly && !isAuthenticated) return false;
    return true;
  });

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const dashboardHref =
    user?.role === "provider" ? "/dashboard/provider" : "/dashboard/customer";

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
          {visibleNavItems.map((item) =>
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
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardHref}
                aria-label={`Open ${user?.role === "provider" ? "provider" : "customer"} dashboard`}
                title="Open my dashboard"
                className="flex items-center gap-2 rounded-full px-2 py-1 text-xs text-brand-muted transition-colors hover:bg-brand-surface/70 hover:text-brand-logo"
              >
                <span className="max-w-[180px] truncate font-medium text-brand-logo">
                  {user?.email}
                </span>
                {user?.role && (
                  <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
                    {user.role}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-brand-surface/70 px-3 py-1.5 text-xs font-semibold text-brand-logo transition-colors duration-150 hover:bg-red-400 hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primaryHover hover:text-white"
            >
              Sign in
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-brand-borderLight text-brand-logo md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-borderLight bg-white md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4 text-sm font-medium text-brand-logo">
            {visibleNavItems.map((item) =>
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
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="flex flex-1 flex-col gap-0.5 rounded-md px-2 py-1 text-xs text-brand-muted transition-colors hover:bg-brand-surface/70"
                  >
                    <span className="truncate text-sm font-semibold text-brand-logo">
                      {user?.email}
                    </span>
                    {user?.role && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
                        {user.role}
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full bg-brand-surface/70 px-3 py-2 text-center font-semibold text-brand-logo transition-colors duration-150 hover:bg-red-400 hover:text-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openAuthModal("login");
                  }}
                  className="flex-1 rounded-md bg-brand-primary px-3 py-2 text-center font-semibold text-white hover:bg-brand-primaryHover"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
