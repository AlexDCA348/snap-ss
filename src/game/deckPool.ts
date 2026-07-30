import { STARTER_CARD_ID_SET } from '../collection/config/starterCards';
import type { PlayerCollection } from '../collection/types';
import { useCollectionStore } from '../store/collectionStore';
import {
  getBuildableCardDefs,
  getBuildableCardIds,
  isBuildableCard,
} from './buildableCards';
import { getCardDef } from './cards';
import type { CardDefinition } from './types';

export { isBuildableCard, getBuildableCardDefs, getBuildableCardIds };

export const DECK_SIZE = 12;

function getCollection(collection?: PlayerCollection): PlayerCollection {
  return collection ?? useCollectionStore.getState().collection;
}

export function isCardUnlockedForDeck(cardId: string, collection: PlayerCollection): boolean {
  if (STARTER_CARD_ID_SET.has(cardId)) return true;
  return collection.unlockedCards.includes(cardId);
}

export function getPlayableCardIdsList(collection?: PlayerCollection): string[] {
  const col = getCollection(collection);
  return getBuildableCardDefs()
    .filter((def) => isCardUnlockedForDeck(def.id, col))
    .map((def) => def.id);
}

export function getPlayableCardDefs(collection?: PlayerCollection): CardDefinition[] {
  const col = getCollection(collection);
  const playableIds = new Set(getPlayableCardIdsList(col));
  return getBuildableCardDefs().filter((c) => playableIds.has(c.id));
}

const buildableIdSet = () => new Set(getBuildableCardIds());

export type DeckValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateDeck(
  cardIds: string[],
  collection?: PlayerCollection,
): DeckValidationResult {
  if (cardIds.length !== DECK_SIZE) {
    return {
      ok: false,
      reason: `Le deck doit contenir exactement ${DECK_SIZE} cartes (${cardIds.length}/${DECK_SIZE}).`,
    };
  }
  const col = getCollection(collection);
  const pool = buildableIdSet();
  const seen = new Set<string>();
  for (const id of cardIds) {
    if (!pool.has(id)) {
      return { ok: false, reason: `Carte non autorisée dans un deck : ${id}.` };
    }
    if (!isCardUnlockedForDeck(id, col)) {
      const name = getCardDef(id).name;
      return {
        ok: false,
        reason: `Carte verrouillée : ${name}. Complétez son armure dans l'Armurerie.`,
      };
    }
    if (seen.has(id)) {
      const name = getCardDef(id).name;
      return { ok: false, reason: `Doublon interdit : ${name}.` };
    }
    seen.add(id);
  }
  return { ok: true };
}

export function isValidDeck(
  cardIds: string[],
  collection?: PlayerCollection,
): boolean {
  return validateDeck(cardIds, collection).ok;
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Tire `count` ids uniques depuis le pool buildable (deck IA). */
export function shuffleBuildableIds(count: number = DECK_SIZE): string[] {
  const pool = getBuildableCardIds();
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/** Tire `count` ids uniques depuis le pool jouable (deck joueur). */
export function shufflePlayableIds(
  count: number = DECK_SIZE,
  collection?: PlayerCollection,
): string[] {
  const pool = getPlayableCardIdsList(collection);
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}
