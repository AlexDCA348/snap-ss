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

/** Lames dorées — au révélé de Shura (carte adverse révélée puis détruite). */
export function collectShuraRevealBlades(
  preReveal: GameState,
  post: GameState,
): ShuraBladeBurst[] {
  const bursts: ShuraBladeBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SHURA_DEF_ID) continue;

    const enemy = otherSide(step.side);
    const enemiesAfter = post.lanes[step.lane].cards[enemy];
    const enemiesBefore = step.stateBeforeEffect.lanes[step.lane].cards[enemy];

    // Cartes apparues côté adverse (tirées du deck) puis détruites.
    const beforeUids = new Set(enemiesBefore.map((c) => c.uid));
    const afterUids = new Set(enemiesAfter.map((c) => c.uid));

    const preGraveUids = new Set(
      preReveal.graveyard[enemy].map((c) => c.uid),
    );
    for (const c of post.graveyard[enemy]) {
      if (preGraveUids.has(c.uid)) continue; // déjà au cimetière avant
      if (beforeUids.has(c.uid)) continue; // était déjà sur le lieu
      if (afterUids.has(c.uid)) continue; // encore vivante

      const slotIndex = slotIndexForCard(
        post,
        step.lane,
        enemy,
        c.uid,
      );
      // Détruite : slot introuvable → fallback 0.
      bursts.push({
        sourceUid: step.revealed.uid,
        targetUid: c.uid,
        lane: step.lane,
        targetSide: enemy,
        slotIndex: slotIndex >= 0 ? slotIndex : 0,
        stagger: 0,
      });
    }
  }

  return bursts;
}
