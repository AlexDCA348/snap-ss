import { isOnRevealDisabled } from './abilities';
import { SAGA_ILLUSION_DEF_ID } from './sagaIllusion';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SAGA_DEF_ID = 'saga';
export const SAGA_DUPLICATE_MS = 2000;

export interface SagaDuplicateBurst {
  sourceUid: string;
  illusionUid: string;
  sourceLane: LocationIndex;
  targetLane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
  targetSlotIndex: number;
}

/** Illusion de Saga — duplication visuelle vers un autre lieu au révélé. */
export function collectSagaRevealDuplicates(
  preReveal: GameState,
  post: GameState,
): SagaDuplicateBurst[] {
  const bursts: SagaDuplicateBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SAGA_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const sagaAfter = post.lanes[step.lane].cards[step.side].find(
      (c) => c.uid === step.revealed.uid,
    );
    const illusionUid = sagaAfter?.sagaTwinUid;
    if (!illusionUid) continue;

    let targetLane: LocationIndex | null = null;
    let targetSlotIndex = -1;

    for (const lane of [0, 1, 2] as LocationIndex[]) {
      const illusion = post.lanes[lane].cards[step.side].find(
        (c) => c.uid === illusionUid && c.defId === SAGA_ILLUSION_DEF_ID,
      );
      if (!illusion) continue;
      targetLane = lane;
      targetSlotIndex = slotIndexForCard(post, lane, step.side, illusionUid);
      break;
    }

    if (targetLane === null || targetSlotIndex < 0) continue;

    const sourceSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      step.side,
      step.revealed.uid,
    );
    if (sourceSlotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      illusionUid,
      sourceLane: step.lane,
      targetLane,
      side: step.side,
      sourceSlotIndex,
      targetSlotIndex,
    });
  }

  return bursts;
}
