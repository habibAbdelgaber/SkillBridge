import { useEffect } from "react";

import { AppRouter } from "@/app/router";
import { useAuthStore } from "@/store/authStore";

export function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  // On first mount, if we have persisted tokens, validate them by fetching
  // the current user. This keeps the store in sync with the actual session.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <AppRouter />;
}

export default App;
