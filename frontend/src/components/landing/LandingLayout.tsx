import { Outlet } from "react-router-dom";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

/**
 * Marketing-page layout.
 *
 * Distinct from `MainLayout` so the public landing surface can use its own
 * navbar IA and a full-bleed footer without affecting the in-app shell used
 * by the auth and (eventually) dashboard routes.
 */
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
