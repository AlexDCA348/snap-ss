import { isLaneSilenced } from './abilities';
import type { CardInstance, GameState, LocationIndex } from './types';

export const SHAKA_DEF_ID = 'shaka';

export function isShakaCard(defId: string): boolean {
  return defId === SHAKA_DEF_ID;
}

/**
 * Mandala visible uniquement si Shaka est déposé sur un lieu, révélé,
 * non silencié, et que son continu n'est pas coupé (Camus / Sibérie).
 */
export function isShakaMandalaActive(
  state: GameState,
  card: CardInstance,
  lane: LocationIndex | null | undefined,
): boolean {
  if (!isShakaCard(card.defId)) return false;
  if (lane === null || lane === undefined) return false;
  if (!card.revealed) return false;
  if (card.silenced) return false;
  if (isLaneSilenced(state, lane)) return false;

  return state.lanes[lane].cards[card.ownerId].some((c) => c.uid === card.uid);
}
