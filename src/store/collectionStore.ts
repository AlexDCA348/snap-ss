import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ARMOR_CATALOG } from '../collection/data/armorCatalog';
import { grantVictoryReward } from '../collection/services/RewardService';
import {
  COLLECTION_SCHEMA_VERSION,
  COLLECTION_STORAGE_KEY,
  createDefaultCollection,
  hydrateCollectionState,
  serializeCollectionState,
} from '../collection/services/SaveService';
import { craftFragment } from '../collection/services/ArmorCollectionService';
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
  /** Message court après un craft (succès / échec). */
  craftFeedback: string | null;
  grantVictoryRewardForMatch: (matchSerial: number) => Reward | null;
  dismissPendingReward: () => void;
  craftMissingFragment: (fragmentId: string) => boolean;
  clearCraftFeedback: () => void;
  getArmorViewModels: () => ArmorViewModel[];
  getArmorDetail: (armorId: string) => ArmorDetailViewModel | null;
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collection: createDefaultCollection(),
      pendingReward: null,
      lastRewardedMatchSerial: -1,
      craftFeedback: null,

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

      craftMissingFragment: (fragmentId) => {
        const result = craftFragment(get().collection, ARMOR_CATALOG, fragmentId);
        if (!result.ok) {
          set({ craftFeedback: result.reason });
          return false;
        }

        const chapterSync = syncUnlockedChapters(result.collection, ARMOR_CATALOG);
        const cardName = result.justCompletedArmor
          ? ` Armure complète — carte débloquée !`
          : '';
        set({
          collection: chapterSync.collection,
          craftFeedback: `Pièce forgée.${cardName}`,
        });
        return true;
      },

      clearCraftFeedback: () => set({ craftFeedback: null }),

      getArmorViewModels: () => buildArmorViewModels(get().collection),

      getArmorDetail: (armorId) => buildArmorDetailViewModel(armorId, get().collection),
    }),
    {
      name: COLLECTION_STORAGE_KEY,
      partialize: (state) =>
        serializeCollectionState({
          version: COLLECTION_SCHEMA_VERSION,
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
          craftFeedback: null,
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
