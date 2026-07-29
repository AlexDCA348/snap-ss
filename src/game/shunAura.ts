import { isLaneSilenced } from './abilities';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SHUN_DEF_ID = 'shun';

/** Andromède Shun révélé ici, effet continu actif (non silencié, lieu non muet). */
export function isShunAuraActive(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): boolean {
  if (isLaneSilenced(state, lane)) return false;
  return state.lanes[lane].cards[side].some(
    (c) => c.defId === SHUN_DEF_ID && !c.silenced,
  );
}
