import { isOnRevealDisabled, isProtected } from './abilities';
import { getCardDef } from './cards';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex } from './types';

export const BABEL_DEF_ID = 'babel';
export const BABEL_FIREBALL_MS = 1600;

export interface BabelFireballBurst {
  sourceUid: string;
  lane: LocationIndex;
  targetSide: 'player' | 'ai';
  slotIndex: number;
}

export function isBabelCard(defId: string): boolean {
  return defId === BABEL_DEF_ID;
}

/** Boules de feu au révélé de Babel (ennemi coût 1–2 détruit). */
export function collectBabelRevealFireballs(
  preReveal: GameState,
  post: GameState,
): BabelFireballBurst[] {
  const bursts: BabelFireballBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== BABEL_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const enemy = step.side === 'player' ? 'ai' : 'player';
    const enemiesBefore = step.stateBeforeEffect.lanes[step.lane].cards[enemy];

    for (const enemyCard of enemiesBefore) {
      const def = getCardDef(enemyCard.defId);
      if (def.cost > 2) continue;
      if (isProtected(step.stateBeforeEffect, enemyCard, step.lane)) continue;

      const enemyAfter = post.lanes[step.lane].cards[enemy].find(
        (c) => c.uid === enemyCard.uid,
      );
      if (enemyAfter) continue;

      const slotIndex = slotIndexForCard(
        step.stateBeforeEffect,
        step.lane,
        enemy,
        enemyCard.uid,
      );
      if (slotIndex < 0) continue;

      bursts.push({
        sourceUid: step.revealed.uid,
        lane: step.lane,
        targetSide: enemy,
        slotIndex,
      });
    }
  }

  return bursts;
}
