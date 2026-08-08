import { resolveShuraRevealThenDestroy } from './abilities';
import { SHURA_DEF_ID } from './shuraBlade';
import { enumerateRevealSteps } from './revealVfx';
import type { GameState, LocationIndex, PlayerId } from './types';

export const SHURA_SUMMON_MS = 950;

export interface ShuraSummonBurst {
  /** uid de Shura (source de l'effet). */
  sourceUid: string;
  /** uid de la carte tirée. */
  targetUid: string;
  defId: string;
  lane: LocationIndex;
  /** Côté où la carte apparaît (deck / main d'origine). */
  targetSide: PlayerId;
  slotIndex: number;
}

/**
 * Vol de la carte tirée par Shura depuis la zone « main » du camp cible
 * jusqu'à son slot sur le lieu.
 */
export function collectShuraSummonBursts(
  preReveal: GameState,
  post: GameState,
): ShuraSummonBurst[] {
  const bursts: ShuraSummonBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SHURA_DEF_ID) continue;

    const onLane = step.stateBeforeEffect.lanes[step.lane].cards[step.side].find(
      (c) => c.uid === step.pending.uid,
    );
    if (!onLane) continue;

    const { placedUid, placedDefId, summonSlotIndex, summonSide } =
      resolveShuraRevealThenDestroy(step.stateBeforeEffect, onLane, step.lane);

    if (!placedUid || !placedDefId || summonSlotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      targetUid: placedUid,
      defId: placedDefId,
      lane: step.lane,
      targetSide: summonSide,
      slotIndex: summonSlotIndex,
    });
  }

  return bursts;
}
