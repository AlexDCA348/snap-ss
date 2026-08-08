import { slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const IKKI_DEF_ID = 'ikki';
export const IKKI_PHOENIX_MS = 1400;

export interface IkkiPhoenixBurst {
  sourceUid: string;
  /** Même uid que la source : le phénix s’élève sur Ikki puis rejoint la main. */
  targetUid: string;
  lane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
  targetSlotIndex: number;
}

export function isIkkiCard(defId: string): boolean {
  return defId === IKKI_DEF_ID;
}

function findIkkiOnBoard(
  state: GameState,
  uid: string,
): { lane: LocationIndex; side: PlayerId } | null {
  for (const lane of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      if (state.lanes[lane].cards[side].some((c) => c.uid === uid)) {
        return { lane, side };
      }
    }
  }
  return null;
}

function pushBurst(
  bursts: IkkiPhoenixBurst[],
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  uid: string,
) {
  if (bursts.some((b) => b.sourceUid === uid)) return;
  const slotIndex = slotIndexForCard(state, lane, side, uid);
  if (slotIndex < 0) return;
  bursts.push({
    sourceUid: uid,
    targetUid: uid,
    lane,
    side,
    sourceSlotIndex: slotIndex,
    targetSlotIndex: slotIndex,
  });
}

/**
 * Phénix de feu quand Ikki est détruit : double sa puissance et retourne en main.
 * Même overlay qu’avant (élévation puis retour vers la main).
 */
export function collectIkkiDeathPhoenix(
  preReveal: GameState,
  post: GameState,
): IkkiPhoenixBurst[] {
  const bursts: IkkiPhoenixBurst[] = [];

  for (const side of ['player', 'ai'] as PlayerId[]) {
    for (const lane of [0, 1, 2] as LocationIndex[]) {
      for (const card of preReveal.lanes[lane].cards[side]) {
        if (card.defId !== IKKI_DEF_ID) continue;
        const inHand = post.players[side].hand.some((c) => c.uid === card.uid);
        if (!inHand) continue;
        if (findIkkiOnBoard(post, card.uid)) continue;
        pushBurst(bursts, preReveal, lane, side, card.uid);
      }

      for (const card of preReveal.players[side].pending[lane]) {
        if (card.defId !== IKKI_DEF_ID) continue;
        const inHand = post.players[side].hand.some((c) => c.uid === card.uid);
        if (!inHand) continue;
        if (findIkkiOnBoard(post, card.uid)) continue;
        pushBurst(bursts, preReveal, lane, side, card.uid);
      }
    }
  }

  return bursts;
}

/** @deprecated Préférer {@link collectIkkiDeathPhoenix}. */
export const collectIkkiRevealPhoenix = collectIkkiDeathPhoenix;
