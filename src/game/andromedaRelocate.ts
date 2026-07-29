import { ANDROMEDA_ISLAND_EFFECT_ID } from './locationEffects';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const ANDROMEDA_RELOCATE_MS = 1050;

export interface AndromedaRelocateBurst {
  sourceUid: string;
  defId: string;
  sourceLane: LocationIndex;
  targetLane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
  targetSlotIndex: number;
}

function laneForCard(
  state: GameState,
  uid: string,
): { lane: LocationIndex; side: PlayerId } | null {
  for (const lane of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      if (state.lanes[lane].cards[side].some((c) => c.uid === uid)) {
        return { lane, side };
      }
    }
  }
  return null;
}

/** Île d'Andromède — la carte révélée est ensuite déplacée vers un autre lieu. */
export function collectAndromedaRelocateBursts(
  preReveal: GameState,
  post: GameState,
): AndromedaRelocateBurst[] {
  const bursts: AndromedaRelocateBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (
      step.stateBeforeEffect.locations[step.lane]?.effect?.id !==
      ANDROMEDA_ISLAND_EFFECT_ID
    ) {
      continue;
    }

    const postPos = laneForCard(post, step.revealed.uid);
    if (postPos === null || postPos.lane === step.lane) continue;

    const sourceSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      step.side,
      step.revealed.uid,
    );
    const targetSlotIndex = slotIndexForCard(
      post,
      postPos.lane,
      postPos.side,
      step.revealed.uid,
    );
    if (sourceSlotIndex < 0 || targetSlotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      defId: step.revealed.defId,
      sourceLane: step.lane,
      targetLane: postPos.lane,
      side: postPos.side,
      sourceSlotIndex,
      targetSlotIndex,
    });
  }

  return bursts;
}
