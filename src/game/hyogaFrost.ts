import { getCardDef } from './cards';
import { enumerateRevealSteps } from './revealVfx';
import type { GameState, LocationIndex } from './types';

export const HYOGA_DEF_ID = 'hyoga';
export const HYOGA_FROST_MS = 1900;

export interface HyogaFrostBurst {
  sourceUid: string;
  targetUid: string;
  lane: LocationIndex;
}

function otherSide(side: 'player' | 'ai') {
  return side === 'player' ? 'ai' : 'player';
}

export function isHyogaCard(defId: string): boolean {
  return defId === HYOGA_DEF_ID;
}

/** Jet de flocons + emprisonnement au révélé d'Hyoga. */
export function collectHyogaRevealFrost(
  preReveal: GameState,
  post: GameState,
): HyogaFrostBurst[] {
  const bursts: HyogaFrostBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== HYOGA_DEF_ID) continue;

    const enemy = otherSide(step.side);
    const enemiesBefore = step.stateBeforeEffect.lanes[step.lane].cards[enemy];

    for (const cardBefore of enemiesBefore) {
      if (cardBefore.silenced) continue;
      const def = getCardDef(cardBefore.defId);
      if (def.ability?.kind !== 'ongoing') continue;

      const cardAfter = post.lanes[step.lane].cards[enemy].find(
        (c) => c.uid === cardBefore.uid,
      );
      if (!cardAfter?.silenced) continue;

      bursts.push({
        sourceUid: step.revealed.uid,
        targetUid: cardBefore.uid,
        lane: step.lane,
      });
      break;
    }
  }

  return bursts;
}
