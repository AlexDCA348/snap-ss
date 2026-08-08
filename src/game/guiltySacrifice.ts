import { applyOnReveal, currentPower, isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const GUILTY_DEF_ID = 'guilty';

/** Durée de base + stagger par cible (explosion → absorption). */
export const GUILTY_SACRIFICE_BASE_MS = 2200;
export const GUILTY_SACRIFICE_PER_TARGET_MS = 420;
export const GUILTY_SACRIFICE_MS = 3800;

export interface GuiltySacrificeTarget {
  targetUid: string;
  slotIndex: number;
  stagger: number;
  /** Puissance absorbée (avant destruction). */
  power: number;
}

export interface GuiltySacrificeBurst {
  sourceUid: string;
  lane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
  /** Puissance de Guilty avant absorption. */
  basePower: number;
  /** Puissance finale après absorption. */
  finalPower: number;
  targets: GuiltySacrificeTarget[];
}

export function guiltySacrificeDurationMs(targetCount: number): number {
  return Math.max(
    GUILTY_SACRIFICE_MS,
    GUILTY_SACRIFICE_BASE_MS + Math.max(0, targetCount) * GUILTY_SACRIFICE_PER_TARGET_MS,
  );
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

/** Masque démoniaque — au révélé de Guilty (alliés détruits + cosmos absorbé). */
export function collectGuiltyRevealSacrifice(
  preReveal: GameState,
  post: GameState,
): GuiltySacrificeBurst[] {
  void post;
  const bursts: GuiltySacrificeBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== GUILTY_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const lane = step.lane;
    const side = step.side;
    const beforeAllies = step.stateBeforeEffect.lanes[lane].cards[side];
    const guiltyBefore = beforeAllies.find((c) => c.uid === step.revealed.uid);
    if (!guiltyBefore) continue;

    const afterEffect = stateAfterStepEffect(step);
    const afterAllies = afterEffect.lanes[lane].cards[side];
    const afterSet = new Set(afterAllies.map((c) => c.uid));

    const destroyed = beforeAllies.filter(
      (c) => c.uid !== step.revealed.uid && !afterSet.has(c.uid),
    );
    if (destroyed.length === 0) continue;

    const targets: GuiltySacrificeTarget[] = [];
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
        power: currentPower(step.stateBeforeEffect, card),
      });
    });
    if (targets.length === 0) continue;

    const sourceSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      lane,
      side,
      step.revealed.uid,
    );
    if (sourceSlotIndex < 0) continue;

    const guiltyAfter = afterAllies.find((c) => c.uid === step.revealed.uid);
    const gained = targets.reduce((sum, t) => sum + t.power, 0);

    bursts.push({
      sourceUid: step.revealed.uid,
      lane,
      side,
      sourceSlotIndex,
      basePower: currentPower(step.stateBeforeEffect, guiltyBefore),
      finalPower: guiltyAfter
        ? currentPower(afterEffect, guiltyAfter)
        : guiltyBefore.basePower + gained,
      targets,
    });
  }

  return bursts;
}
