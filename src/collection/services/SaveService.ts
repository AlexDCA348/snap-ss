import { STARTER_CARD_IDS } from '../config/starterCards';
import { DEFAULT_UNLOCKED_CHAPTERS } from '../config/chapters';
import type { ArmorCatalog, PersistedCollectionState, PlayerCollection } from '../types';
import { ensureCollectionConsistency } from './CardCollectionService';
import { syncUnlockedChapters } from './ChapterProgressService';

export const COLLECTION_STORAGE_KEY = 'saint-seiya-snap-collection-v1';
export const COLLECTION_SCHEMA_VERSION = 1;

export function createDefaultCollection(): PlayerCollection {
  return {
    ownedFragments: {},
    unlockedCards: [...STARTER_CARD_IDS],
    unlockedChapterIds: [...DEFAULT_UNLOCKED_CHAPTERS],
  };
}

export function createDefaultPersistedState(): PersistedCollectionState {
  return {
    version: COLLECTION_SCHEMA_VERSION,
    collection: createDefaultCollection(),
    lastRewardedMatchSerial: -1,
  };
}

export function hydrateCollectionState(
  raw: unknown,
  catalog: ArmorCatalog,
): PersistedCollectionState {
  if (!raw || typeof raw !== 'object') {
    return createDefaultPersistedState();
  }

  const data = raw as Partial<PersistedCollectionState>;
  const collection = data.collection ?? createDefaultCollection();
  const consistent = ensureCollectionConsistency(collection, catalog);

  return {
    version: COLLECTION_SCHEMA_VERSION,
    collection: syncUnlockedChapters(consistent, catalog).collection,
    lastRewardedMatchSerial:
      typeof data.lastRewardedMatchSerial === 'number'
        ? data.lastRewardedMatchSerial
        : -1,
  };
}

export function serializeCollectionState(
  state: PersistedCollectionState,
): PersistedCollectionState {
  return {
    version: COLLECTION_SCHEMA_VERSION,
    collection: state.collection,
    lastRewardedMatchSerial: state.lastRewardedMatchSerial,
  };
}
