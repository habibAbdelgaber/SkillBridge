import { create } from "zustand";

type ThemeMode = "light" | "dark";
export type AuthModalMode = "login" | "register";

interface UIState {
  isSidebarOpen: boolean;
  authModalMode: AuthModalMode | null;
  authRedirectPath: string | null;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openAuthModal: (mode: AuthModalMode, redirectPath?: string | null) => void;
  closeAuthModal: () => void;
  switchAuthModal: (mode: AuthModalMode) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  authModalMode: null,
  authRedirectPath: null,
  theme: "light",
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openAuthModal: (mode, redirectPath = null) =>
    set({ authModalMode: mode, authRedirectPath: redirectPath }),
  closeAuthModal: () => set({ authModalMode: null, authRedirectPath: null }),
  switchAuthModal: (mode) => set({ authModalMode: mode }),
  setTheme: (theme) => set({ theme }),
}));
