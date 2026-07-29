import type { GameState, LocationIndex } from './types';

export const ATHENA_DEF_ID = 'athena';

export interface AthenaRippleSource {
  uid: string;
  lane: LocationIndex;
}

/** Athéna révélée quelque part — ripple doré depuis la carte. */
export function isAthenaWaveActive(state: GameState): boolean {
  return listAthenaRippleSources(state).length > 0;
}

export function listAthenaRippleSources(state: GameState): AthenaRippleSource[] {
  const sources: AthenaRippleSource[] = [];
  for (const [laneIndex, lane] of state.lanes.entries()) {
    for (const side of ['player', 'ai'] as const) {
      for (const card of lane.cards[side]) {
        if (card.defId === ATHENA_DEF_ID && !card.silenced) {
          sources.push({ uid: card.uid, lane: laneIndex as LocationIndex });
        }
      }
    }
  }
  return sources;
}

export function isAthenaCard(defId: string): boolean {
  return defId === ATHENA_DEF_ID;
}
