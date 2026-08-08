import { getCardDef } from './cards';
import { isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SAGITTARIUS_ARMOR_DEF_ID = 'sagittarius-armor';
export const SAGITTARIUS_ARMOR_MERGE_MS = 900;

export interface SagittariusArmorMergeBurst {
  sourceUid: string;
  targetUid: string;
  lane: LocationIndex;
  side: PlayerId;
  sourceSlotIndex: number;
  targetSlotIndex: number;
}

export function isSagittariusArmorCard(defId: string): boolean {
  return defId === SAGITTARIUS_ARMOR_DEF_ID;
}

/**
 * Détecte la fusion Armure du Sagittaire : allié qui gagne pile +5
 * par rapport à sa puissance initiale, source absente après coup.
 */
export function collectSagittariusArmorMergeBursts(
  preReveal: GameState,
  post: GameState,
): SagittariusArmorMergeBurst[] {
  const bursts: SagittariusArmorMergeBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SAGITTARIUS_ARMOR_DEF_ID) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const side = step.side;
    const lane = step.lane;
    const beforeAllies = step.stateBeforeEffect.lanes[lane].cards[side];
    const afterAllies = post.lanes[lane].cards[side];
    const amount =
      (getCardDef(SAGITTARIUS_ARMOR_DEF_ID).ability?.params?.amount as number) ??
      5;

    const sourceGone = !afterAllies.some((c) => c.uid === step.pending.uid);
    if (!sourceGone) continue;

    for (const before of beforeAllies) {
      if (before.uid === step.pending.uid) continue;
      const after = afterAllies.find((c) => c.uid === before.uid);
      if (!after) continue;
      const initial = getCardDef(before.defId).power;
      if (after.basePower !== initial + amount) continue;

      bursts.push({
        sourceUid: step.revealed.uid,
        targetUid: before.uid,
        lane,
        side,
        sourceSlotIndex: Math.max(
          0,
          slotIndexForCard(step.stateBeforeEffect, lane, side, step.pending.uid),
        ),
        targetSlotIndex: Math.max(
          0,
          slotIndexForCard(step.stateBeforeEffect, lane, side, before.uid),
        ),
      });
      break;
    }
  }

  return bursts;
}
