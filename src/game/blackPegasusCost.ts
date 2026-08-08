import { isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const BLACK_PEGASUS_DEF_ID = 'black-pegasus';
export const BLACK_PEGASUS_COST_MS = 900;

export interface BlackPegasusCostBurst {
  sourceUid: string;
  lane: LocationIndex;
  sourceSide: PlayerId;
  targetUid: string;
  targetSide: PlayerId;
  costAdded: number;
}

export function isBlackPegasusCard(defId: string): boolean {
  return defId === BLACK_PEGASUS_DEF_ID;
}

/** Blob rouge vers la carte de main adverse touchée au révélé. */
export function collectBlackPegasusCostBursts(
  preReveal: GameState,
  post: GameState,
): BlackPegasusCostBurst[] {
  const bursts: BlackPegasusCostBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== BLACK_PEGASUS_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const enemy: PlayerId = step.side === 'player' ? 'ai' : 'player';
    const beforeHand = step.stateBeforeEffect.players[enemy].hand;
    const afterHand = post.players[enemy].hand;

    for (const before of beforeHand) {
      const after = afterHand.find((c) => c.uid === before.uid);
      if (!after) continue;
      const beforeDelta = before.costDelta ?? 0;
      const afterDelta = after.costDelta ?? 0;
      if (afterDelta <= beforeDelta) continue;

      bursts.push({
        sourceUid: step.revealed.uid,
        lane: step.lane,
        sourceSide: step.side,
        targetUid: before.uid,
        targetSide: enemy,
        costAdded: afterDelta - beforeDelta,
      });
    }
  }

  return bursts;
}
