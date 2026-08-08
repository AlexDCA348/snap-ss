import { isLaneSilenced } from './abilities';
import type { GameState, LocationIndex, PlayerId } from './types';

export const BLACK_ANDROMEDA_DEF_ID = 'black-andromeda';

export interface BlackAndromedaVineSource {
  uid: string;
  lane: LocationIndex;
  side: PlayerId;
  /** Lieux adjacents ciblés par les lianes. */
  targets: LocationIndex[];
}

export function isBlackAndromedaCard(defId: string): boolean {
  return defId === BLACK_ANDROMEDA_DEF_ID;
}

function adjacentLanes(lane: LocationIndex): LocationIndex[] {
  const out: LocationIndex[] = [];
  if (lane > 0) out.push((lane - 1) as LocationIndex);
  if (lane < 2) out.push((lane + 1) as LocationIndex);
  return out;
}

/**
 * Sources de lianes — uniquement les Andromède Noir révélées
 * (présentes dans `lane.cards`), non silenciées.
 */
export function listBlackAndromedaVineSources(
  state: GameState,
): BlackAndromedaVineSource[] {
  const sources: BlackAndromedaVineSource[] = [];
  for (const [laneIndex, lane] of state.lanes.entries()) {
    const laneIdx = laneIndex as LocationIndex;
    if (isLaneSilenced(state, laneIdx)) continue;
    for (const side of ['player', 'ai'] as const) {
      for (const card of lane.cards[side]) {
        if (card.defId !== BLACK_ANDROMEDA_DEF_ID || card.silenced) continue;
        const targets = adjacentLanes(laneIdx);
        if (targets.length === 0) continue;
        sources.push({
          uid: card.uid,
          lane: laneIdx,
          side,
          targets,
        });
      }
    }
  }
  return sources;
}
