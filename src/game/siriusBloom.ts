import { isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SIRIUS_DEF_ID = 'sirius';
export const SIRIUS_BLOOM_MS = 1100;

export interface SiriusBloomBurst {
  sourceUid: string;
  lane: LocationIndex;
  side: PlayerId;
  slotIndex: number;
}

export function isSiriusCard(defId: string): boolean {
  return defId === SIRIUS_DEF_ID;
}

/** Blob rose — au révélé de Sirius vers le deck du propriétaire. */
export function collectSiriusRevealBlooms(
  preReveal: GameState,
  post: GameState,
): SiriusBloomBurst[] {
  const bursts: SiriusBloomBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SIRIUS_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;
    if (step.stateBeforeEffect.players[step.side].deck.length === 0) continue;

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
