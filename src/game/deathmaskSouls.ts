import { isOnRevealDisabled } from './abilities';
import { enumerateRevealSteps, slotIndexForCard } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const DEATHMASK_DEF_ID = 'deathmask';
export const LOST_SOUL_DEF_ID = 'lost-soul';
export const DEATHMASK_SOULS_MS = 2400;

export interface DeathmaskSoulSpawn {
  lane: LocationIndex;
  side: PlayerId;
  soulUid: string;
  slotIndex: number;
}

export interface DeathmaskSoulBurst {
  sourceUid: string;
  sourceLane: LocationIndex;
  sourceSide: PlayerId;
  sourceSlotIndex: number;
  spawns: DeathmaskSoulSpawn[];
}

export function isDeathmaskCard(defId: string): boolean {
  return defId === DEATHMASK_DEF_ID;
}

/** Fantômes + âmes perdues au révélé de DeathMask (sauf sur son propre lieu). */
export function collectDeathmaskRevealSouls(
  preReveal: GameState,
  post: GameState,
): DeathmaskSoulBurst[] {
  const bursts: DeathmaskSoulBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== DEATHMASK_DEF_ID) continue;
    if (step.pending.abilityUsed) continue;
    if (isOnRevealDisabled(step.stateBeforeEffect, step.lane)) continue;

    const sourceLane = step.lane;
    const spawns: DeathmaskSoulSpawn[] = [];

    for (const lane of [0, 1, 2] as LocationIndex[]) {
      if (lane === sourceLane) continue;

      for (const side of ['player', 'ai'] as PlayerId[]) {
        const before = step.stateBeforeEffect.lanes[lane].cards[side];
        const after = post.lanes[lane].cards[side];
        const newSouls = after.filter(
          (c) =>
            c.defId === LOST_SOUL_DEF_ID &&
            !before.some((b) => b.uid === c.uid),
        );

        for (const soul of newSouls) {
          const slotIndex = slotIndexForCard(post, lane, side, soul.uid);
          if (slotIndex < 0) continue;
          spawns.push({ lane, side, soulUid: soul.uid, slotIndex });
        }
      }
    }

    if (spawns.length === 0) continue;

    const sourceSlotIndex = slotIndexForCard(
      step.stateBeforeEffect,
      sourceLane,
      step.side,
      step.revealed.uid,
    );
    if (sourceSlotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      sourceLane,
      sourceSide: step.side,
      sourceSlotIndex,
      spawns,
    });
  }

  return bursts;
}
