import { applyOnReveal, isOnRevealDisabled } from './abilities';
import { getCardDef } from './cards';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const DANTE_DEF_ID = 'dante';
export const DANTE_CHAIN_MS = 2600;

export interface DanteChainTarget {
  targetUid: string;
  lane: LocationIndex;
  side: PlayerId;
  slotIndex: number;
  stagger: number;
}

export interface DanteChainBurst {
  sourceUid: string;
  sourceLane: LocationIndex;
  sourceSide: PlayerId;
  sourceSlotIndex: number;
  targets: DanteChainTarget[];
}

function stateAfterStepEffect(
  step: ReturnType<typeof enumerateRevealSteps>[number],
): GameState {
  if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) {
    return step.stateBeforeEffect;
  }
  const onLane = step.stateBeforeEffect.lanes[step.lane].cards[step.side].find(
    (c) => c.uid === step.pending.uid,
  );
  if (!onLane) return step.stateBeforeEffect;
  return applyOnReveal(step.stateBeforeEffect, onLane, step.lane);
}

/** Chaîne du Cerbère — au révélé de Dante (coût 1 sur tout le plateau). */
export function collectDanteRevealChains(
  preReveal: GameState,
  post: GameState,
): DanteChainBurst[] {
  void post;
  const bursts: DanteChainBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== DANTE_DEF_ID) continue;

    const afterEffect = stateAfterStepEffect(step);
    const targets: DanteChainTarget[] = [];
    let stagger = 0;

    for (const lane of [0, 1, 2] as LocationIndex[]) {
      for (const side of ['player', 'ai'] as PlayerId[]) {
        const before = step.stateBeforeEffect.lanes[lane].cards[side];
        const after = afterEffect.lanes[lane].cards[side];
        const afterSet = new Set(after.map((c) => c.uid));

        for (const card of before) {
          if (card.uid === step.revealed.uid) continue;
          if (getCardDef(card.defId).cost !== 1) continue;
          if (afterSet.has(card.uid)) continue;

          const slotIndex = slotIndexForCard(
            step.stateBeforeEffect,
            lane,
            side,
            card.uid,
          );
          if (slotIndex < 0) continue;

          targets.push({
            targetUid: card.uid,
            lane,
            side,
            slotIndex,
            stagger,
          });
          stagger += 1;
        }
      }
    }

    if (targets.length === 0) continue;

    const sourceSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      step.side,
      step.revealed.uid,
    );
    if (sourceSlotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      sourceLane: step.lane,
      sourceSide: step.side,
      sourceSlotIndex,
      targets,
    });
  }

  return bursts;
}
