import { Outlet } from "react-router-dom";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function MainLayout() {
  return (
    <div className="flex min-h-full flex-col bg-brand-background text-brand">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
