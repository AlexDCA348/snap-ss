import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCollectionStore } from './collectionStore';
import {
  DECK_SIZE,
  isCardUnlockedForDeck,
  isValidDeck,
  shufflePlayableIds,
} from '../game/deckPool';
import { buildPresetDeck, getDeckPreset } from '../game/deckPresets';

export const DECK_SLOT_COUNT = 5;

export interface SavedDeck {
  name: string;
  cardIds: string[];
  updatedAt: number;
}

function emptySlot(index: number): SavedDeck {
  return {
    name: `Deck ${index + 1}`,
    cardIds: [],
    updatedAt: Date.now(),
  };
}

function defaultSlots(): SavedDeck[] {
  return Array.from({ length: DECK_SLOT_COUNT }, (_, i) => emptySlot(i));
}

interface DeckStore {
  slots: SavedDeck[];
  activeSlotIndex: number;
  editingSlotIndex: number;
  setActiveSlot: (index: number) => void;
  setEditingSlot: (index: number) => void;
  renameDeck: (name: string) => void;
  addCard: (defId: string) => boolean;
  removeCard: (defId: string) => void;
  clearDeck: () => void;
  fillRandom: () => void;
  fillPreset: (presetId: string) => boolean;
  copyDeckToSlot: (fromIndex: number, toIndex: number) => void;
  getActiveDeck: () => SavedDeck;
  getEditingDeck: () => SavedDeck;
  isActiveDeckValid: () => boolean;
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      slots: defaultSlots(),
      activeSlotIndex: 0,
      editingSlotIndex: 0,

      setActiveSlot: (index) => {
        if (index < 0 || index >= DECK_SLOT_COUNT) return;
        set({ activeSlotIndex: index });
      },

      setEditingSlot: (index) => {
        if (index < 0 || index >= DECK_SLOT_COUNT) return;
        set({ editingSlotIndex: index });
      },

      renameDeck: (name) => {
        const i = get().editingSlotIndex;
        set((s) => ({
          slots: s.slots.map((deck, idx) =>
            idx === i
              ? { ...deck, name: name.trim() || `Deck ${i + 1}`, updatedAt: Date.now() }
              : deck,
          ),
        }));
      },

      addCard: (defId) => {
        const i = get().editingSlotIndex;
        const deck = get().slots[i];
        const collection = useCollectionStore.getState().collection;
        if (deck.cardIds.length >= DECK_SIZE) return false;
        if (deck.cardIds.includes(defId)) return false;
        if (!isCardUnlockedForDeck(defId, collection)) return false;
        set((s) => ({
          slots: s.slots.map((d, idx) =>
            idx === i
              ? {
                  ...d,
                  cardIds: [...d.cardIds, defId],
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }));
        return true;
      },

      removeCard: (defId) => {
        const i = get().editingSlotIndex;
        set((s) => ({
          slots: s.slots.map((d, idx) =>
            idx === i
              ? {
                  ...d,
                  cardIds: d.cardIds.filter((id) => id !== defId),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }));
      },

      clearDeck: () => {
        const i = get().editingSlotIndex;
        set((s) => ({
          slots: s.slots.map((d, idx) =>
            idx === i ? { ...d, cardIds: [], updatedAt: Date.now() } : d,
          ),
        }));
      },

      fillRandom: () => {
        const i = get().editingSlotIndex;
        set((s) => ({
          slots: s.slots.map((d, idx) =>
            idx === i
              ? {
                  ...d,
                  cardIds: shufflePlayableIds(DECK_SIZE),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }));
      },

      fillPreset: (presetId) => {
        const preset = getDeckPreset(presetId);
        if (!preset) return false;
        const cardIds = buildPresetDeck(presetId);
        if (!isValidDeck(cardIds)) return false;
        const i = get().editingSlotIndex;
        set((s) => ({
          slots: s.slots.map((d, idx) =>
            idx === i
              ? {
                  ...d,
                  name: preset.name,
                  cardIds,
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }));
        return true;
      },

      copyDeckToSlot: (fromIndex, toIndex) => {
        if (
          fromIndex < 0 ||
          fromIndex >= DECK_SLOT_COUNT ||
          toIndex < 0 ||
          toIndex >= DECK_SLOT_COUNT
        ) {
          return;
        }
        const source = get().slots[fromIndex];
        set((s) => ({
          slots: s.slots.map((d, idx) =>
            idx === toIndex
              ? {
                  ...d,
                  cardIds: [...source.cardIds],
                  name: `${source.name} (copie)`,
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }));
      },

      getActiveDeck: () => get().slots[get().activeSlotIndex],

      getEditingDeck: () => get().slots[get().editingSlotIndex],

      isActiveDeckValid: () => isValidDeck(get().getActiveDeck().cardIds),
    }),
    {
      name: 'saint-seiya-snap-decks-v2',
      partialize: (state) => ({
        slots: state.slots,
        activeSlotIndex: state.activeSlotIndex,
        editingSlotIndex: state.editingSlotIndex,
      }),
    },
  ),
);
