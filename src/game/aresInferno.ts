import { computeOngoing, effectivePower } from './abilities';
import type { CardInstance, GameState } from './types';

export const ARES_DEF_ID = 'grand-pope-ares';

export function isAresCard(defId: string): boolean {
  return defId === ARES_DEF_ID;
}

/** Somme des puissances des cartes détruites pendant la partie. */
export function getTotalDestroyedPower(state: GameState): number {
  return state.totalDestroyedPower ?? 0;
}

export function isCardOnBoard(state: GameState, uid: string): boolean {
  for (const lane of state.lanes) {
    if (
      lane.cards.player.some((c) => c.uid === uid) ||
      lane.cards.ai.some((c) => c.uid === uid)
    ) {
      return true;
    }
  }
  return false;
}

/** Puissance d'Arès : somme des puissances détruites (main/deck ou plateau). */
export function aresDisplayPower(card: CardInstance, state: GameState): number {
  if (!isAresCard(card.defId)) {
    return effectivePower(card, computeOngoing(state));
  }
  const ongoing = computeOngoing(state);
  if (isCardOnBoard(state, card.uid)) {
    return effectivePower(card, ongoing);
  }
  return getTotalDestroyedPower(state);
}

/** 0 à puissance 0 → 1 quand Arès accumule des âmes détruites. */
export function aresInfernoIntensity(power: number): number {
  if (power <= 0) return 0;
  return Math.min(1, 0.22 + power * 0.11);
}

export function aresInfernoAnimSpeed(power: number): number {
  if (power <= 0) return 0.65;
  return Math.min(2.4, 0.65 + power * 0.14);
}

export function aresAuraClass(surge?: boolean): string {
  return surge ? 'card-frame--ares-surge' : '';
}
