import { create } from "zustand";

export interface ProviderAccountDraft {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface ProviderSignupState {
  draft: ProviderAccountDraft | null;
  setDraft: (draft: ProviderAccountDraft) => void;
  clearDraft: () => void;
}

const STORAGE_KEY = "skillbridge.providerSignup.draft.v1";

function loadDraft(): ProviderAccountDraft | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProviderAccountDraft) : null;
  } catch {
    return null;
  }
}

function persistDraft(draft: ProviderAccountDraft | null): void {
  try {
    if (draft) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage unavailable */
  }
}

export const useProviderSignupStore = create<ProviderSignupState>((set) => ({
  draft: loadDraft(),
  setDraft: (draft) => {
    persistDraft(draft);
    set({ draft });
  },
  clearDraft: () => {
    persistDraft(null);
    set({ draft: null });
  },
}));
