import { slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const JAMIAN_DEF_ID = 'jamian';
export const JAMIAN_CROWS_MS = 1550;

export interface JamianCrowBurst {
  sourceUid: string;
  lane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
}

export function isJamianCard(defId: string): boolean {
  return defId === JAMIAN_DEF_ID;
}

/** Essaim de corbeaux en fin de révélation (retour en main +1 pwr). */
export function collectJamianEndOfRevealCrows(
  beforeJamian: GameState,
  after: GameState,
): JamianCrowBurst[] {
  if (beforeJamian.turn >= beforeJamian.maxTurns) return [];

  const bursts: JamianCrowBurst[] = [];

  for (const side of ['player', 'ai'] as PlayerId[]) {
    for (const lane of [0, 1, 2] as LocationIndex[]) {
      for (const card of beforeJamian.lanes[lane].cards[side]) {
        if (card.defId !== JAMIAN_DEF_ID) continue;
        if (card.playedTurn !== beforeJamian.turn) continue;

        const jamianInHand = after.players[side].hand.find((c) => c.uid === card.uid);
        if (!jamianInHand) continue;
        if (jamianInHand.basePower !== card.basePower + 1) continue;

        const sourceSlotIndex = slotIndexForCard(
          beforeJamian,
          lane,
          side,
          card.uid,
        );
        if (sourceSlotIndex < 0) continue;

        bursts.push({
          sourceUid: card.uid,
          lane,
          side,
          sourceSlotIndex,
        });
      }
    }
  }

  return bursts;
}

/** @deprecated Préférer {@link collectJamianEndOfRevealCrows}. */
export const collectJamianRevealCrows = collectJamianEndOfRevealCrows;
