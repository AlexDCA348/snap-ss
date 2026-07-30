import { resolveShuraRevealThenDestroy } from './abilities';
import { enumerateRevealSteps } from './revealVfx';
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

export function isShuraCard(defId: string): boolean {
  return defId === SHURA_DEF_ID;
}

/**
 * Lames dorées — au révélé de Shura, seulement si la carte tirée
 * est détruite (puissance inférieure et non indestructible).
 * Le slotIndex est pris sur l'état « après placement » (carte encore là).
 */
export function collectShuraRevealBlades(
  preReveal: GameState,
  post: GameState,
): ShuraBladeBurst[] {
  const bursts: ShuraBladeBurst[] = [];

  for (const step of enumerateRevealSteps(preReveal, post)) {
    if (step.pending.defId !== SHURA_DEF_ID) continue;

    const onLane = step.stateBeforeEffect.lanes[step.lane].cards[step.side].find(
      (c) => c.uid === step.pending.uid,
    );
    if (!onLane) continue;

    const { destroyedUid, slotIndex, enemySide } = resolveShuraRevealThenDestroy(
      step.stateBeforeEffect,
      onLane,
      step.lane,
    );

    if (!destroyedUid || slotIndex < 0) continue;

    bursts.push({
      sourceUid: step.revealed.uid,
      targetUid: destroyedUid,
      lane: step.lane,
      targetSide: enemySide,
      slotIndex,
      stagger: 0,
    });
  }

  return bursts;
}
