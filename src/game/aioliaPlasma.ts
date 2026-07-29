import {
  applyOnReveal,
  currentPower,
  isOnRevealDisabled,
  isProtected,
} from './abilities';
import { getCardDef } from './cards';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const AIOLIA_DEF_ID = 'aiolia';
export const AIOLIA_PLASMA_MS = 1800;

export interface AioliaPlasmaBurst {
  sourceUid: string;
  lane: LocationIndex;
  targetSide: PlayerId;
  slotIndex: number;
  stagger: number;
}

export function isAioliaCard(defId: string): boolean {
  return defId === AIOLIA_DEF_ID;
}

/** Segments de lumière au révélé d'Aiolia (cartes détruites sur sa lane uniquement). */
export function collectAioliaRevealPlasma(
  preReveal: GameState,
  post: GameState,
): AioliaPlasmaBurst[] {
  const bursts: AioliaPlasmaBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== AIOLIA_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const onLane = step.stateBeforeEffect.lanes[step.lane].cards[step.side].find(
      (c) => c.uid === step.revealed.uid,
    );
    if (!onLane) continue;

    const stateAfterAiolia = applyOnReveal(
      step.stateBeforeEffect,
      onLane,
      step.lane,
    );

    const maxPowerInclusive =
      (getCardDef(AIOLIA_DEF_ID).ability?.params?.maxPower as number) ?? 3;
    let stagger = 0;

    for (const targetSide of ['player', 'ai'] as const) {
      const cardsBefore =
        step.stateBeforeEffect.lanes[step.lane].cards[targetSide];

      for (const card of cardsBefore) {
        if (card.uid === step.revealed.uid) continue;
        if (currentPower(step.stateBeforeEffect, card) > maxPowerInclusive) {
          continue;
        }
        if (isProtected(step.stateBeforeEffect, card, step.lane)) continue;

        const stillThere = stateAfterAiolia.lanes[step.lane].cards[
          targetSide
        ].some((c) => c.uid === card.uid);
        if (stillThere) continue;

        const slotIndex = slotIndexForCard(
          step.stateBeforeEffect,
          step.lane,
          targetSide,
          card.uid,
        );
        if (slotIndex < 0) continue;

        bursts.push({
          sourceUid: step.revealed.uid,
          lane: step.lane,
          targetSide,
          slotIndex,
          stagger,
        });
        stagger += 1;
      }
    }
  }

  return bursts;
}
