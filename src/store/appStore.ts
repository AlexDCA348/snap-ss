import { create } from 'zustand';
import type { ChapterId } from '../collection/types';

export type AppScreen = 'menu' | 'deckBuilder' | 'game' | 'armory' | 'infinity';

interface AppStore {
  screen: AppScreen;
  armoryChapterId: ChapterId | null;
  toast: string | null;
  goToMenu: () => void;
  goToDeckBuilder: () => void;
  goToGame: () => void;
  goToArmory: (chapterId?: ChapterId | null) => void;
  goToInfinity: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  screen: 'menu',
  armoryChapterId: null,
  toast: null,
  goToMenu: () => set({ screen: 'menu', armoryChapterId: null }),
  goToDeckBuilder: () => set({ screen: 'deckBuilder' }),
  goToGame: () => set({ screen: 'game' }),
  goToArmory: (chapterId = null) =>
    set({ screen: 'armory', armoryChapterId: chapterId }),
  goToInfinity: () => set({ screen: 'infinity' }),
  showToast: (message) => {
    set({ toast: message });
    window.setTimeout(() => {
      set((s) => (s.toast === message ? { toast: null } : s));
    }, 2200);
  },
  clearToast: () => set({ toast: null }),
}));
