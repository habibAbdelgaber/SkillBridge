import { create } from "zustand";

/**
 * Global UI store placeholder.
 *
 * Keeps cross-cutting UI flags (sidebar, modals, theme intent) in one place
 * so feature modules don't have to re-invent this each time.
 */
type ThemeMode = "light" | "dark";

interface UIState {
  isSidebarOpen: boolean;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  theme: "light",
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
