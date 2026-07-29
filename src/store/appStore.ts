import { create } from 'zustand';

export type AppScreen = 'menu' | 'deckBuilder' | 'game' | 'armory';

interface AppStore {
  screen: AppScreen;
  toast: string | null;
  goToMenu: () => void;
  goToDeckBuilder: () => void;
  goToGame: () => void;
  goToArmory: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  screen: 'menu',
  toast: null,
  goToMenu: () => set({ screen: 'menu' }),
  goToDeckBuilder: () => set({ screen: 'deckBuilder' }),
  goToGame: () => set({ screen: 'game' }),
  goToArmory: () => set({ screen: 'armory' }),
  showToast: (message) => {
    set({ toast: message });
    window.setTimeout(() => {
      set((s) => (s.toast === message ? { toast: null } : s));
    }, 2200);
  },
  clearToast: () => set({ toast: null }),
}));
