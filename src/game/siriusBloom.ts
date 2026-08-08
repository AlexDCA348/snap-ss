import { isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SIRIUS_DEF_ID = 'sirius';
export const SIRIUS_BLOOM_MS = 1100;

/** Cartes Au révélé type Kiki / Cygnus Noir (+cosmos prochain tour). */
export const COSMOS_BLOOM_DEF_IDS = new Set(['kiki', 'black-cygnus']);

export type BloomTint = 'pink' | 'blue';

export interface SiriusBloomBurst {
  sourceUid: string;
  lane: LocationIndex;
  side: PlayerId;
  slotIndex: number;
  /** Rose = Sirius (deck) ; bleu = cosmos next-turn (Kiki, Cygnus Noir…). */
  tint: BloomTint;
}

export function isSiriusCard(defId: string): boolean {
  return defId === SIRIUS_DEF_ID;
}

function collectBloomForDefs(
  preReveal: GameState,
  post: GameState,
  defIds: Set<string> | string,
  tint: BloomTint,
  requireDeck = false,
): SiriusBloomBurst[] {
  const allowed =
    typeof defIds === 'string' ? new Set([defIds]) : defIds;
  const bursts: SiriusBloomBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (!allowed.has(step.pending.defId)) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;
    if (
      requireDeck &&
      step.stateBeforeEffect.players[step.side].deck.length === 0
    ) {
      continue;
    }

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
      tint,
    });
  }

  return bursts;
}

/** Blob rose — au révélé de Sirius vers le deck du propriétaire. */
export function collectSiriusRevealBlooms(
  preReveal: GameState,
  post: GameState,
): SiriusBloomBurst[] {
  return collectBloomForDefs(
    preReveal,
    post,
    SIRIUS_DEF_ID,
    'pink',
    true,
  );
}

/** Blob bleu — au révélé Kiki / Cygnus Noir (+cosmos prochain tour). */
export function collectCosmosRevealBlooms(
  preReveal: GameState,
  post: GameState,
): SiriusBloomBurst[] {
  return collectBloomForDefs(preReveal, post, COSMOS_BLOOM_DEF_IDS, 'blue');
}
