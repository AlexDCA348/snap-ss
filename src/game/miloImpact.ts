import { getCardDef } from './cards';
import { enumerateRevealSteps } from './revealVfx';
import type { GameState, LocationIndex } from './types';

export const MILO_DEF_ID = 'milo';
export const MILO_IMPACT_MS = 1500;

export interface MiloImpactBurst {
  sourceUid: string;
  targetUid: string;
  lane: LocationIndex;
  stagger: number;
}

function otherSide(side: 'player' | 'ai') {
  return side === 'player' ? 'ai' : 'player';
}

export function isMiloCard(defId: string): boolean {
  return defId === MILO_DEF_ID;
}

/** Impacts rouges au révélé de Milo (−2 à tous les ennemis ici). */
export function collectMiloRevealImpacts(
  preReveal: GameState,
  post: GameState,
): MiloImpactBurst[] {
  const impacts: MiloImpactBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== MILO_DEF_ID) continue;

    const amount =
      (getCardDef(MILO_DEF_ID).ability?.params?.amount as number) ?? 2;
    const enemy = otherSide(step.side);
    const enemiesBefore = step.stateBeforeEffect.lanes[step.lane].cards[enemy];
    let stagger = 0;

    for (const enemyCard of enemiesBefore) {
      const enemyAfter = post.lanes[step.lane].cards[enemy].find(
        (c) => c.uid === enemyCard.uid,
      );
      if (!enemyAfter) continue;
      if (enemyAfter.basePower !== enemyCard.basePower - amount) continue;

      impacts.push({
        sourceUid: step.revealed.uid,
        targetUid: enemyAfter.uid,
        lane: step.lane,
        stagger,
      });
      stagger += 1;
    }
  }

  return impacts;
}
