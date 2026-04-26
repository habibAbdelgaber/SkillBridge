import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";

/**
 * Inverse of `RequireAuth`: if the user is already logged in, keep them out
 * of the login/register screens and route them to the home page instead.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
