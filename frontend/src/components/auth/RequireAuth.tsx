import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

interface RequireAuthProps {
  children: ReactNode;
}

/** Opens the login modal for guests and remembers the requested path. */
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const location = useLocation();

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      openAuthModal("login", location.pathname);
    }
  }, [isAuthenticated, isHydrating, location.pathname, openAuthModal]);

  if (isHydrating) {
    return (
      <div className="flex min-h-full items-center justify-center p-10 text-sm text-brand-muted">
        Loading your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-full items-center justify-center p-10 text-sm text-brand-muted">
        Sign in to continue.
      </div>
    );
  }
  return <>{children}</>;
}
