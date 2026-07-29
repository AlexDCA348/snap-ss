import { getBuildableCardDefs } from '../../game/buildableCards';
import { STARTER_CARD_ID_SET } from '../config/starterCards';
import type { ArmorCatalog, PlayerCollection } from '../types';
import { recomputeUnlockedCards } from './ArmorCollectionService';

export function isCardUnlocked(
  cardId: string,
  collection: PlayerCollection,
): boolean {
  if (STARTER_CARD_ID_SET.has(cardId)) return true;
  return collection.unlockedCards.includes(cardId);
}

export function getPlayableCardIds(collection: PlayerCollection): string[] {
  return getBuildableCardDefs()
    .filter((def) => isCardUnlocked(def.id, collection))
    .map((def) => def.id);
}

export function getLockedCardIds(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
): string[] {
  return catalog.armors
    .filter((armor) => !isCardUnlocked(armor.unlockedCardId, collection))
    .map((armor) => armor.unlockedCardId);
}

export function ensureCollectionConsistency(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
): PlayerCollection {
  return {
    ...collection,
    unlockedCards: recomputeUnlockedCards(collection, catalog),
  };
}
