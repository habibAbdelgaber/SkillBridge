import { Outlet } from "react-router-dom";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

export function LandingLayout() {
  return (
    <div className="flex min-h-full flex-col bg-brand-background text-brand">
      <LandingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
}
