import { effectivePower, type OngoingResult } from './abilities';
import { isSagaGalaxyActive } from './sagaGalaxy';
import type { CardInstance, GameState, LocationIndex, PlayerId } from './types';

export const SAGA_ILLUSION_DEF_ID = 'saga-illusion';
export const SAGA_DOUBLE_DEF_ID = 'saga-double';

function isSagaIllusionCard(card: CardInstance): boolean {
  return card.defId === SAGA_ILLUSION_DEF_ID || Boolean(card.sagaIllusion);
}

/**
 * Puissance utilisée pour les scores de lane (UI + fin de partie).
 * L'illusion Saga compte comme son jumeau tant que la partie est en cours ;
 * à la révélation (phase ended), elle retombe à 0.
 */
export function scoringPower(
  state: GameState,
  card: CardInstance,
  ongoing: OngoingResult,
): number {
  if (isSagaIllusionCard(card)) {
    if (state.phase === 'ended') {
      return effectivePower(card, ongoing);
    }
    if (card.sagaTwinUid) {
      const twin = findCardByUid(state, card.sagaTwinUid);
      if (twin) {
        return effectivePower(twin.card, ongoing);
      }
    }
  }
  return effectivePower(card, ongoing);
}

export function findCardByUid(
  state: GameState,
  uid: string,
): { card: CardInstance; lane: LocationIndex; side: PlayerId } | null {
  for (const lane of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      const card = state.lanes[lane].cards[side].find((c) => c.uid === uid);
      if (card) return { card, lane, side };
    }
  }
  return null;
}

export function isSagaBluffTarget(card: CardInstance): boolean {
  return card.defId === 'saga' || Boolean(card.sagaIllusion);
}

export interface SagaCardPresentation {
  defId: string;
  displayPower: number;
  showIllusionBadge: boolean;
  /** VFX galaxie — synchronisé pour le bluff adverse. */
  showGalaxyVfx: boolean;
}

/** Présentation visuelle pour le bluff Saga (vérité pour le propriétaire). */
export function resolveSagaCardPresentation(
  card: CardInstance,
  viewerId: PlayerId,
  state: GameState,
  ongoing: OngoingResult,
  laneIndex?: LocationIndex,
): SagaCardPresentation | null {
  if (!isSagaBluffTarget(card)) return null;

  const actualPower = effectivePower(card, ongoing);

  // Fin de partie : les faux Saga se révèlent comme des doublons inversés (0 pwr).
  if (state.phase === 'ended' && isSagaIllusionCard(card)) {
    return {
      defId: SAGA_DOUBLE_DEF_ID,
      displayPower: 0,
      showIllusionBadge: false,
      showGalaxyVfx: false,
    };
  }

  if (viewerId === card.ownerId) {
    return {
      defId: card.defId,
      displayPower: actualPower,
      showIllusionBadge: Boolean(card.sagaIllusion),
      showGalaxyVfx:
        laneIndex !== undefined &&
        isSagaGalaxyActive(state, card, laneIndex),
    };
  }

  const twinUid = card.sagaTwinUid;
  if (!twinUid) return null;

  const twinFound = findCardByUid(state, twinUid);
  if (!twinFound) return null;

  const realCard = card.sagaIllusion ? twinFound.card : card;
  const realLane = card.sagaIllusion ? twinFound.lane : laneIndex;
  const bluffPower = effectivePower(realCard, ongoing);

  return {
    defId: 'saga',
    displayPower: bluffPower,
    showIllusionBadge: false,
    showGalaxyVfx:
      realLane !== undefined &&
      isSagaGalaxyActive(state, realCard, realLane),
  };
}
