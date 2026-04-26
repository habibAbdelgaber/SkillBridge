import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * The white card wrapper used by the login + register screens.
 * Keeps the heading + body + optional footer rhythm consistent.
 */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-brand-logo">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-brand-muted">{subtitle}</p>
        )}
      </header>
      <div className="flex flex-col gap-5">{children}</div>
      {footer && (
        <footer className="text-center text-sm text-brand-muted">
          {footer}
        </footer>
      )}
    </div>
  );
}
