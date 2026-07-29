import { getCardDef } from './cards';
import { isLaneSilenced } from './abilities';
import type { CardInstance, GameState, LocationIndex } from './types';

export const SAGA_DEF_ID = 'saga';
export const DOHKO_DEF_ID = 'dokko';
export const GALAXY_DOUBLE_ABILITY_ID = 'ongoing-double-allies-here';

export function isSagaCard(defId: string): boolean {
  return defId === SAGA_DEF_ID;
}

export function isDohkoCard(defId: string): boolean {
  return defId === DOHKO_DEF_ID;
}

/** Saga, Dohko, etc. — ×2 alliés sur le lieu. */
export function isGalaxyDoubleCard(defId: string): boolean {
  return getCardDef(defId).ability?.id === GALAXY_DOUBLE_ABILITY_ID;
}

/**
 * Explosion galactique visible si la carte double les alliés sur ce lieu
 * (Saga, Dohko…), révélée, non silenciée, et continu actif.
 */
export function isSagaGalaxyActive(
  state: GameState,
  card: CardInstance,
  lane: LocationIndex | null | undefined,
): boolean {
  if (!isGalaxyDoubleCard(card.defId)) return false;
  if (lane === null || lane === undefined) return false;
  if (!card.revealed) return false;
  if (card.silenced) return false;
  if (isLaneSilenced(state, lane)) return false;

  return state.lanes[lane].cards[card.ownerId].some((c) => c.uid === card.uid);
}
