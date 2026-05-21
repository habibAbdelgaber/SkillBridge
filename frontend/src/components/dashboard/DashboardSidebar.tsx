import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Logo } from "@/components/ui/Logo";
import { LogoutIcon } from "@/components/ui/LogoutIcon";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";
import { formatUserFullName } from "@/utils/displayName";

interface DashboardSidebarProps {
  user: AuthUser;
  initials: string;
  variant: "provider" | "customer";
  className?: string;
}

interface SidebarItem {
  to: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
}

const Icons = {
  home: (
    <span className="w-4 text-center text-[13px]" aria-hidden="true">
      🏠
    </span>
  ),
  jobs: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M4 7h16v12H4z" />
      <path d="M9 7V5h6v2" strokeLinecap="round" />
    </svg>
  ),
  bookings: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M9 4v4M15 4v4M4 11h16" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  earnings: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M12 2v20M17 6.5a4 4 0 0 0-4-2.5C10 4 8 5.5 8 7.5S10 11 12.5 11s4 1.5 4 3.5S14.5 19 12 19a4 4 0 0 1-4-2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  payments: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
    </svg>
  ),
  messages: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  reviews: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M12 2.5l2.95 6 6.6.95-4.78 4.65 1.13 6.55L12 17.55 6.1 20.65l1.13-6.55L2.45 9.45l6.6-.95L12 2.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profile: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  ),
  favorite: (
    <span className="w-4 text-center text-[13px]" aria-hidden="true">
      ⭐
    </span>
  ),
  settings: (
    <span className="w-4 text-center text-[13px]" aria-hidden="true">
      ⚙️
    </span>
  ),
  logout: <LogoutIcon />,
};

const PROVIDER_ITEMS: SidebarItem[] = [
  { to: "/dashboard/provider", label: "Jobs", icon: Icons.jobs, exact: true },
  { to: "/dashboard/provider/calendar", label: "Calendar", icon: Icons.calendar },
  { to: "/dashboard/provider/earnings", label: "Earnings", icon: Icons.earnings },
  { to: "/dashboard/provider/messages", label: "Messages", icon: Icons.messages },
  { to: "/dashboard/provider/reviews", label: "Reviews", icon: Icons.reviews },
  { to: "/dashboard/provider/profile", label: "Profile", icon: Icons.profile },
];

const CUSTOMER_ITEMS: SidebarItem[] = [
  { to: "/dashboard/customer", label: "Home", icon: Icons.home, exact: true },
  { to: "/dashboard/customer/bookings", label: "My bookings", icon: Icons.bookings },
  { to: "/dashboard/customer/payments", label: "Payments", icon: Icons.payments },
  { to: "/dashboard/customer/messages", label: "Messages", icon: Icons.messages },
  { to: "/dashboard/customer/favorites", label: "Favorites", icon: Icons.favorite },
  { to: "/dashboard/customer/settings", label: "Settings", icon: Icons.settings },
];

const VARIANT_CONFIG = {
  provider: {
    eyebrowLabel: "Provider",
    eyebrowClass: "bg-amber-50 text-amber-700",
    items: PROVIDER_ITEMS,
    profileHref: "/dashboard/provider/profile",
    fallbackSubtitle: "Certified pro",
  },
  customer: {
    eyebrowLabel: "Customer",
    eyebrowClass: "bg-brand-surface text-brand-logo",
    items: CUSTOMER_ITEMS,
    profileHref: "/dashboard/customer/profile",
    fallbackSubtitle: "",
  },
} as const;

export function DashboardSidebar({
  user,
  initials,
  variant,
  className,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const cfg = VARIANT_CONFIG[variant];
  const fullName = formatUserFullName(user.first_name, user.last_name, user.email);
  const subtitle =
    variant === "provider" && user.provider_profile?.business_name
      ? user.provider_profile.business_name
      : variant === "customer"
        ? user.email
        : cfg.fallbackSubtitle;

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-brand-borderLight bg-white",
        className,
      )}
    >
      <Link
        to="/home"
        title="Back to home"
        className={cn(
          "flex items-center gap-2 transition-colors hover:bg-brand-surface/40",
          variant === "customer" ? "px-5 py-4" : "px-5 py-5",
        )}
      >
        <Logo className={cn(variant === "customer" ? "h-6 w-6" : "h-7 w-7")} />
        <span className="text-sm font-bold tracking-tight text-brand-logo">
          SkillBridge
        </span>
      </Link>

      <div
        className={cn(
          "mx-3 rounded-sm px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em]",
          cfg.eyebrowClass,
        )}
      >
        {cfg.eyebrowLabel}
      </div>

      <nav className="mt-3 flex flex-1 flex-col gap-1 px-3">
        {cfg.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-primary text-white shadow-sm hover:text-white"
                  : "text-brand-logo hover:bg-brand-surface/60",
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div
        className={cn(
          "px-4 py-4",
          variant === "provider" && "border-t border-brand-borderLight",
        )}
      >
        <div className="flex items-center gap-2">
          <NavLink
            to={cfg.profileHref}
            title="Open my profile"
            className={({ isActive }) =>
              cn(
                "flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 transition-colors",
                isActive
                  ? "bg-brand-surface/70"
                  : "bg-brand-background hover:bg-brand-surface/60",
              )
            }
          >
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4f9bc8] text-xs font-bold text-white"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-logo">
                {fullName}
              </p>
              <p className="truncate text-xs text-brand-muted">{subtitle}</p>
            </div>
          </NavLink>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            disabled={isSigningOut}
            onClick={() => void handleLogout()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-background text-brand-logo transition-colors duration-150 hover:bg-red-400 hover:text-white disabled:cursor-wait disabled:opacity-70"
          >
            {Icons.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}
