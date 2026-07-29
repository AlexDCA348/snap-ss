import { slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SHIRYU_DEF_ID = 'shiryu';
export const SHIRYU_DRAGON_MS = 1600;

export interface ShiryuDragonBurst {
  id: string;
  uid: string;
  lane: LocationIndex;
  side: PlayerId;
  slotIndex: number;
}

function findCardInState(
  state: GameState,
  uid: string,
): { lane: LocationIndex; side: PlayerId } | null {
  for (const [laneIndex, lane] of state.lanes.entries()) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      if (lane.cards[side].some((c) => c.uid === uid)) {
        return { lane: laneIndex as LocationIndex, side };
      }
    }
  }
  return null;
}

/** Dragon en comète quand Shiryu est détruit. */
export function collectShiryuDeathBursts(
  preReveal: GameState,
  postReveal: GameState,
): ShiryuDragonBurst[] {
  const bursts: ShiryuDragonBurst[] = [];

  for (const side of ['player', 'ai'] as PlayerId[]) {
    const newInGrave = postReveal.graveyard[side].filter(
      (c) =>
        c.defId === SHIRYU_DEF_ID &&
        !preReveal.graveyard[side].some((p) => p.uid === c.uid),
    );

    for (const shiryu of newInGrave) {
      const prePos = findCardInState(preReveal, shiryu.uid);
      if (!prePos) continue;

      const slotIndex = slotIndexForCard(
        preReveal,
        prePos.lane,
        prePos.side,
        shiryu.uid,
      );
      if (slotIndex < 0) continue;

      bursts.push({
        id: `${shiryu.uid}-d${postReveal.turn}`,
        uid: shiryu.uid,
        lane: prePos.lane,
        side: prePos.side,
        slotIndex,
      });
    }
  }

  return bursts;
}

export function isShiryuCard(defId: string): boolean {
  return defId === SHIRYU_DEF_ID;
}

/** @deprecated Préférer {@link collectShiryuDeathBursts}. */
export const collectShiryuTickBursts = collectShiryuDeathBursts;
