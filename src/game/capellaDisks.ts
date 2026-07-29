import { applyOnReveal, isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const CAPELLA_DEF_ID = 'capella';
export const CAPELLA_DISKS_MS = 1800;

export interface CapellaDiskTarget {
  targetUid: string;
  slotIndex: number;
  stagger: number;
}

export interface CapellaDiskBurst {
  sourceUid: string;
  lane: LocationIndex;
  side: PlayerId;
  targets: CapellaDiskTarget[];
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

/** Disques d’Auriga — au révélé de Capella (alliés détruits sur ce lieu). */
export function collectCapellaRevealDisks(
  preReveal: GameState,
  post: GameState,
): CapellaDiskBurst[] {
  void post;
  const bursts: CapellaDiskBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== CAPELLA_DEF_ID) continue;

    const lane = step.lane;
    const side = step.side;
    const beforeAllies = step.stateBeforeEffect.lanes[lane].cards[side];
    const afterEffect = stateAfterStepEffect(step);
    const afterAllies = afterEffect.lanes[lane].cards[side];
    const afterSet = new Set(afterAllies.map((c) => c.uid));

    const destroyed = beforeAllies.filter(
      (c) => c.uid !== step.revealed.uid && !afterSet.has(c.uid),
    );
    if (destroyed.length === 0) continue;

    const targets: CapellaDiskTarget[] = [];
    destroyed.forEach((card, index) => {
      const slotIndex = slotIndexForCard(
        step.stateBeforeEffect,
        lane,
        side,
        card.uid,
      );
      if (slotIndex < 0) return;
      targets.push({
        targetUid: card.uid,
        slotIndex,
        stagger: index,
      });
    });

    if (targets.length === 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      lane,
      side,
      targets,
    });
  }

  return bursts;
}
