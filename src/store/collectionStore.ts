import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ARMOR_CATALOG } from '../collection/data/armorCatalog';
import { grantVictoryReward } from '../collection/services/RewardService';
import {
  COLLECTION_STORAGE_KEY,
  createDefaultCollection,
  hydrateCollectionState,
  serializeCollectionState,
} from '../collection/services/SaveService';
import { ensureCollectionConsistency } from '../collection/services/CardCollectionService';
import { syncUnlockedChapters } from '../collection/services/ChapterProgressService';
import {
  buildArmorDetailViewModel,
  buildArmorViewModels,
} from '../collection/viewModels';
import type {
  ArmorDetailViewModel,
  ArmorViewModel,
} from '../collection/viewModels';
import type { PlayerCollection, Reward } from '../collection/types';

interface CollectionStore {
  collection: PlayerCollection;
  pendingReward: Reward | null;
  lastRewardedMatchSerial: number;
  grantVictoryRewardForMatch: (matchSerial: number) => Reward | null;
  dismissPendingReward: () => void;
  getArmorViewModels: () => ArmorViewModel[];
  getArmorDetail: (armorId: string) => ArmorDetailViewModel | null;
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collection: createDefaultCollection(),
      pendingReward: null,
      lastRewardedMatchSerial: -1,

      grantVictoryRewardForMatch: (matchSerial) => {
        if (matchSerial < 0) return null;
        if (get().lastRewardedMatchSerial === matchSerial) return null;

        const { collection, reward } = grantVictoryReward(get().collection, ARMOR_CATALOG);

        set({
          collection,
          pendingReward: reward,
          lastRewardedMatchSerial: matchSerial,
        });

        return reward;
      },

      dismissPendingReward: () => set({ pendingReward: null }),

      getArmorViewModels: () => buildArmorViewModels(get().collection),

      getArmorDetail: (armorId) => buildArmorDetailViewModel(armorId, get().collection),
    }),
    {
      name: COLLECTION_STORAGE_KEY,
      partialize: (state) =>
        serializeCollectionState({
          version: 1,
          collection: state.collection,
          lastRewardedMatchSerial: state.lastRewardedMatchSerial,
        }),
      merge: (persisted, current) => {
        const hydrated = hydrateCollectionState(persisted, ARMOR_CATALOG);
        return {
          ...current,
          collection: hydrated.collection,
          lastRewardedMatchSerial: hydrated.lastRewardedMatchSerial,
          pendingReward: null,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        let collection = ensureCollectionConsistency(state.collection, ARMOR_CATALOG);
        collection = syncUnlockedChapters(collection, ARMOR_CATALOG).collection;
        state.collection = collection;
      },
    },
  ),
);
