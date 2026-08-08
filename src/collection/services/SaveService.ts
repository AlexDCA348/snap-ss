import { STARTER_CARD_IDS } from '../config/starterCards';
import { DEFAULT_UNLOCKED_CHAPTERS } from '../config/chapters';
import type { ArmorCatalog, PersistedCollectionState, PlayerCollection } from '../types';
import { normalizeStarDustCollection } from './ArmorCollectionService';
import { ensureCollectionConsistency } from './CardCollectionService';
import { syncUnlockedChapters } from './ChapterProgressService';

export const COLLECTION_STORAGE_KEY = 'saint-seiya-snap-collection-v1';
export const COLLECTION_SCHEMA_VERSION = 2;

export function createDefaultCollection(): PlayerCollection {
  return {
    ownedFragments: {},
    starDust: 0,
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
  const rawCollection = data.collection ?? createDefaultCollection();
  const withDust: PlayerCollection = {
    ...createDefaultCollection(),
    ...rawCollection,
    starDust:
      typeof rawCollection.starDust === 'number' ? rawCollection.starDust : 0,
    ownedFragments: rawCollection.ownedFragments ?? {},
  };
  const normalized = normalizeStarDustCollection(withDust);
  const consistent = ensureCollectionConsistency(normalized, catalog);

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
