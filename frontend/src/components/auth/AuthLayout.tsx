import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  variant?: "centered" | "plain";
}

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
