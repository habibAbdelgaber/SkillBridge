import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Route guard: redirect to /login if no session, preserving the intended
 * destination so we can bounce the user back after they sign in.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const location = useLocation();

  if (isHydrating) {
    return (
      <div className="flex min-h-full items-center justify-center p-10 text-sm text-brand-muted">
        Loading your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
