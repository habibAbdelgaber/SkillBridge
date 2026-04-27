import { useEffect } from "react";

import { AppRouter } from "@/app/router";
import { useAuthStore } from "@/store/authStore";

/**
 * Root component.
 *
 * Hydrates the auth session once on mount (so a refresh of any URL re-validates
 * the persisted tokens against the API) and then hands off to the router.
 */
export function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <AppRouter />;
}

export default App;
