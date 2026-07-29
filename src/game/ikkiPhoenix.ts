import { currentPower, isOnRevealDisabled, isProtected } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const IKKI_DEF_ID = 'ikki';
export const IKKI_PHOENIX_MS = 1400;

export interface IkkiPhoenixBurst {
  sourceUid: string;
  targetUid: string;
  lane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
  targetSlotIndex: number;
}

export function isIkkiCard(defId: string): boolean {
  return defId === IKKI_DEF_ID;
}

/** Phénix de feu au révélé d'Ikki (sacrifie allié, retour en main). */
export function collectIkkiRevealPhoenix(
  preReveal: GameState,
  post: GameState,
): IkkiPhoenixBurst[] {
  const bursts: IkkiPhoenixBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== IKKI_DEF_ID) continue;
    if (step.pending.abilityUsed) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const allies = step.stateBeforeEffect.lanes[step.lane].cards[step.side].filter(
      (c) => c.uid !== step.revealed.uid,
    );
    if (allies.length === 0) continue;

    const weakest = allies
      .map((c) => ({ c, p: currentPower(step.stateBeforeEffect, c) }))
      .sort((a, b) => a.p - b.p)[0].c;
    if (isProtected(step.stateBeforeEffect, weakest, step.lane)) continue;

    const targetAfter = post.lanes[step.lane].cards[step.side].find(
      (c) => c.uid === weakest.uid,
    );
    if (targetAfter) continue;

    const ikkiInLane = post.lanes[step.lane].cards[step.side].find(
      (c) => c.uid === step.revealed.uid,
    );
    if (ikkiInLane) continue;

    const ikkiInHand = post.players[step.side].hand.find(
      (c) => c.uid === step.revealed.uid,
    );
    if (!ikkiInHand) continue;

    const sourceSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      step.side,
      step.revealed.uid,
    );
    const targetSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      step.side,
      weakest.uid,
    );
    if (sourceSlotIndex < 0 || targetSlotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      targetUid: weakest.uid,
      lane: step.lane,
      side: step.side,
      sourceSlotIndex,
      targetSlotIndex,
    });
  }

  return bursts;
}
