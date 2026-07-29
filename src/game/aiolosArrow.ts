import { currentPower, isOnRevealDisabled, isProtected } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex } from './types';

export const AIOLOS_DEF_ID = 'aiolos';
export const AIOLOS_ARROW_MS = 1500;

export interface AiolosArrowShot {
  sourceUid: string;
  lane: LocationIndex;
  targetSide: 'player' | 'ai';
  slotIndex: number;
}

function otherSide(side: 'player' | 'ai') {
  return side === 'player' ? 'ai' : 'player';
}

export function isAiolosCard(defId: string): boolean {
  return defId === AIOLOS_DEF_ID;
}

/** Flèche d'or au révélé d'Aiolos (ennemi le plus fort détruit). */
export function collectAiolosRevealArrows(
  preReveal: GameState,
  post: GameState,
): AiolosArrowShot[] {
  const shots: AiolosArrowShot[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== AIOLOS_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const enemy = otherSide(step.side);
    const enemies = step.stateBeforeEffect.lanes[step.lane].cards[enemy];
    if (enemies.length === 0) continue;

    const target = enemies
      .map((c) => ({ c, p: currentPower(step.stateBeforeEffect, c) }))
      .sort((a, b) => b.p - a.p)[0].c;
    if (isProtected(step.stateBeforeEffect, target, step.lane)) continue;

    const targetAfter = post.lanes[step.lane].cards[enemy].find(
      (c) => c.uid === target.uid,
    );
    if (targetAfter) continue;

    const slotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      step.lane,
      enemy,
      target.uid,
    );
    if (slotIndex < 0) continue;

    shots.push({
      sourceUid: step.revealed.uid,
      lane: step.lane,
      targetSide: enemy,
      slotIndex,
    });
  }

  return shots;
}
