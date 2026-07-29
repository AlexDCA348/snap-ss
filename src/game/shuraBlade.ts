import { currentPower } from './abilities';
import { getCardDef } from './cards';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SHURA_DEF_ID = 'shura';
export const SHURA_BLADE_MS = 2200;

export interface ShuraBladeBurst {
  sourceUid: string;
  targetUid: string;
  lane: LocationIndex;
  targetSide: PlayerId;
  slotIndex: number;
  stagger: number;
}

function otherSide(side: PlayerId): PlayerId {
  return side === 'player' ? 'ai' : 'player';
}

export function isShuraCard(defId: string): boolean {
  return defId === SHURA_DEF_ID;
}

/** Lames dorées — au révélé de Shura (cibles détruites sur ce lieu). */
export function collectShuraRevealBlades(
  preReveal: GameState,
  post: GameState,
): ShuraBladeBurst[] {
  const bursts: ShuraBladeBurst[] = [];
  const minPower =
    (getCardDef(SHURA_DEF_ID).ability?.params?.minPower as number) ?? 6;

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SHURA_DEF_ID) continue;

    const enemy = otherSide(step.side);
    const enemiesBefore = step.stateBeforeEffect.lanes[step.lane].cards[enemy];
    let stagger = 0;

    for (const enemyCard of enemiesBefore) {
      if (currentPower(step.stateBeforeEffect, enemyCard) < minPower) continue;

      const stillThere = post.lanes[step.lane].cards[enemy].some(
        (c) => c.uid === enemyCard.uid,
      );
      if (stillThere) continue;

      const slotIndex = slotIndexForCard(
        step.stateBeforeEffect,
        step.lane,
        enemy,
        enemyCard.uid,
      );
      if (slotIndex < 0) continue;

      bursts.push({
        sourceUid: step.revealed.uid,
        targetUid: enemyCard.uid,
        lane: step.lane,
        targetSide: enemy,
        slotIndex,
        stagger,
      });
      stagger += 1;
    }
  }

  return bursts;
}
