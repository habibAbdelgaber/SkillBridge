import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { selectIsAuthenticated, useAuthStore } from "@/store/authStore";

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
