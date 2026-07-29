import { isLaneSilenced } from './abilities';
import type { GameState, LocationIndex } from './types';

export const APHRODITE_DEF_ID = 'aphrodite';

/** Aphrodite révélée sur le lieu — tapis de roses actif. */
export function isAphroditeRosesActive(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isLaneSilenced(state, lane)) return false;
  const all = [
    ...state.lanes[lane].cards.player,
    ...state.lanes[lane].cards.ai,
  ];
  return all.some((c) => c.defId === APHRODITE_DEF_ID && !c.silenced);
}
