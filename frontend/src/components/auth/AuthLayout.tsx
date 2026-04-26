import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  /**
   * `centered` constrains the content to a narrow column (login, register,
   * verify-email, forgot-password). `plain` lets the page span the full
   * `MainLayout` content width — used by the provider business-details page,
   * which lays out its hero rail + form on a wide grid.
   */
  variant?: "centered" | "plain";
}

/**
 * Auth pages live inside `MainLayout` so they share the global header/footer
 * chrome. This component only handles the inner column constraint — the
 * surrounding background, navbar, and footer come from `MainLayout`.
 */
export function AuthLayout({ children, variant = "centered" }: AuthLayoutProps) {
  if (variant === "plain") {
    return <div className="w-full">{children}</div>;
  }
  return (
    <div className="flex w-full justify-center pt-2">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
