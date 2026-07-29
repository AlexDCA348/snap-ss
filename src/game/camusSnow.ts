import type { GameState, LocationIndex } from './types';
import { isSiberiaLocation } from './locationEffects';

export const CAMUS_DEF_ID = 'camus';

/** Camus révélé ici, ou lieu Sibérie — neige / gel sur toute la lane. */
export function isCamusSnowLaneActive(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isSiberiaLocation(state, lane)) return true;
  const all = [
    ...state.lanes[lane].cards.player,
    ...state.lanes[lane].cards.ai,
  ];
  return all.some((c) => c.defId === CAMUS_DEF_ID && !c.silenced);
}
