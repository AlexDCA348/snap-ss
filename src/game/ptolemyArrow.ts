import { currentPower } from './abilities';
import { enumerateRevealSteps } from './revealVfx';
import type { GameState, LocationIndex } from './types';

export const PTOLEMY_DEF_ID = 'ptolemy';
export const PTOLEMY_ARROW_MS = 1400;

export interface PtolemyArrowShot {
  sourceUid: string;
  targetUid: string;
  lane: LocationIndex;
}

function otherSide(side: 'player' | 'ai') {
  return side === 'player' ? 'ai' : 'player';
}

export function isPtolemyCard(defId: string): boolean {
  return defId === PTOLEMY_DEF_ID;
}

/** Détecte les tirs de Ptolémée lors du révélé qui vient de se produire. */
export function collectPtolemyRevealShots(
  preReveal: GameState,
  post: GameState,
): PtolemyArrowShot[] {
  const shots: PtolemyArrowShot[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== PTOLEMY_DEF_ID) continue;

    const enemy = otherSide(step.side);
    const enemies = step.stateBeforeEffect.lanes[step.lane].cards[enemy];
    if (enemies.length === 0) continue;

    const target = enemies
      .map((c) => ({ c, p: currentPower(step.stateBeforeEffect, c) }))
      .sort((a, b) => a.p - b.p)[0].c;

    const targetAfter = post.lanes[step.lane].cards[enemy].find(
      (c) => c.uid === target.uid,
    );
    if (!targetAfter) continue;
    if (targetAfter.basePower !== target.basePower - 3) continue;

    shots.push({
      sourceUid: step.revealed.uid,
      targetUid: target.uid,
      lane: step.lane,
    });
  }

  return shots;
}
