import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const ALDEBARAN_DEF_ID = 'aldebaran';
export const ALDEBARAN_IMPACT_MS = 1500;

export interface AldebaranImpactBurst {
  sourceUid: string;
  lane: LocationIndex;
  side: PlayerId;
  slotIndex: number;
}

export function isAldebaranCard(defId: string): boolean {
  return defId === ALDEBARAN_DEF_ID;
}

/** Choc au révélé d'Aldébaran — pierre lourde sur sa lane. */
export function collectAldebaranRevealImpacts(
  preReveal: GameState,
  post: GameState,
): AldebaranImpactBurst[] {
  const bursts: AldebaranImpactBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== ALDEBARAN_DEF_ID) continue;

    const slotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      step.side,
      step.revealed.uid,
    );
    if (slotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      lane: step.lane,
      side: step.side,
      slotIndex,
    });
  }

  return bursts;
}
