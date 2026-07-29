import { applyOnReveal, isOnRevealDisabled } from './abilities';
import {
  findRevealedCardOnLane,
  isGalacticTournamentDoubleOnReveal,
} from './locationEffects';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const ICHI_DEF_ID = 'ichi';
export const ICHI_CLAW_MS = 1200;
export const ICHI_CLAW_PASS_GAP_MS = 850;

export interface IchiClawBurst {
  id: string;
  sourceUid: string;
  lane: LocationIndex;
  fromSide: PlayerId;
  toSide: PlayerId;
  sourceSlotIndex: number;
  delayMs?: number;
}

export function isIchiCard(defId: string): boolean {
  return defId === ICHI_DEF_ID;
}

/** Chaque traversée d'Ichi au révélé (y compris la 2e passe du Tournoi Galactique). */
export function collectIchiRevealClaws(
  preReveal: GameState,
  post: GameState,
): IchiClawBurst[] {
  const bursts: IchiClawBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== ICHI_DEF_ID) continue;

    let s = step.stateBeforeEffect;
    const passCount = isGalacticTournamentDoubleOnReveal(s, step.lane) ? 2 : 1;

    for (let pass = 0; pass < passCount; pass++) {
      const before = findRevealedCardOnLane(s, step.lane, step.revealed.uid);
      if (!before || isOnRevealDisabled(s, step.lane)) break;

      const sourceSlotIndex = slotIndexForCard(
        s,
        step.lane,
        before.side,
        step.revealed.uid,
      );
      if (sourceSlotIndex < 0) break;

      s = applyOnReveal(s, before.card, step.lane);
      const after = findRevealedCardOnLane(s, step.lane, step.revealed.uid);

      if (after && after.side !== before.side) {
        bursts.push({
          id: `${step.revealed.uid}-p${pass}`,
          sourceUid: step.revealed.uid,
          lane: step.lane,
          fromSide: before.side,
          toSide: after.side,
          sourceSlotIndex,
          delayMs: pass === 0 ? 0 : ICHI_CLAW_PASS_GAP_MS,
        });
      }
    }
  }

  return bursts;
}
