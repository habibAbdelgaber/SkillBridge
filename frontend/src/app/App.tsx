import { useEffect } from "react";

import { AppRouter } from "@/app/router";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthStore } from "@/store/authStore";

export function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <>
      <AppRouter />
      <AuthModal />
    </>
  );
}

export default App;
