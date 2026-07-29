import { isLaneSilenced } from './abilities';
import type { GameState, LocationIndex, PlayerId } from './types';

export const MU_DEF_ID = 'mu';

/** Mû du Bélier révélé ici — mur de cristal actif (protège toute la lane). */
export function isMuShieldActive(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): boolean {
  if (isLaneSilenced(state, lane)) return false;
  return state.lanes[lane].cards[side].some(
    (c) => c.defId === MU_DEF_ID && !c.silenced,
  );
}

/** Mû révélé sur le lieu — aura dorée sur toute la lane. */
export function isMuShieldLaneActive(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isLaneSilenced(state, lane)) return false;
  const all = [
    ...state.lanes[lane].cards.player,
    ...state.lanes[lane].cards.ai,
  ];
  return all.some((c) => c.defId === MU_DEF_ID && !c.silenced);
}
