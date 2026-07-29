import type { CardInstance, GameState, LocationIndex, PlayerId } from './types';
import { LANE_CAPACITY } from './types';

/** Cartes déjà révélées sur ce côté du lieu. */
export function countRevealedOnSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): number {
  return state.lanes[lane].cards[side].length;
}

/** Cartes révélées + en attente (phase de jeu). */
export function countOccupiedOnSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): number {
  return (
    countRevealedOnSide(state, lane, side) +
    state.players[side].pending[lane].length
  );
}

export function canAddRevealedToSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): boolean {
  return countRevealedOnSide(state, lane, side) < LANE_CAPACITY;
}

export function canPlaceCardOnSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): boolean {
  return countOccupiedOnSide(state, lane, side) < LANE_CAPACITY;
}

/** Place libre en comptant révélées + en attente (jetons, relocation…). */
export function canFitAdditionalCardOnSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): boolean {
  return countOccupiedOnSide(state, lane, side) < LANE_CAPACITY;
}

/** Ajoute une carte révélée sur un côté ; no-op si le lieu est plein (max 4). */
export function appendRevealedToSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  card: CardInstance,
): GameState {
  if (!canAddRevealedToSide(state, lane, side)) {
    return {
      ...state,
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${state.locations[lane].name} : ce côté est plein (4 cartes max).`,
        },
      ],
    };
  }
  return {
    ...state,
    lanes: state.lanes.map((l, i) => {
      if (i !== lane) return l;
      return {
        cards: {
          player:
            side === 'player' ? [...l.cards.player, card] : l.cards.player,
          ai: side === 'ai' ? [...l.cards.ai, card] : l.cards.ai,
        },
      };
    }),
  };
}

/** Retire une carte révélée d’un côté du lieu. */
export function removeRevealedFromSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  uid: string,
): GameState {
  return {
    ...state,
    lanes: state.lanes.map((l, i) => {
      if (i !== lane) return l;
      return {
        cards: {
          player:
            side === 'player'
              ? l.cards.player.filter((c) => c.uid !== uid)
              : l.cards.player,
          ai:
            side === 'ai' ? l.cards.ai.filter((c) => c.uid !== uid) : l.cards.ai,
        },
      };
    }),
  };
}

/** Déplace une carte révélée vers un autre lieu (même côté). */
export function moveRevealedCard(
  state: GameState,
  fromLane: LocationIndex,
  toLane: LocationIndex,
  side: PlayerId,
  uid: string,
): GameState | null {
  if (fromLane === toLane) return null;
  if (!canFitAdditionalCardOnSide(state, toLane, side)) return null;
  if (!canAddRevealedToSide(state, toLane, side)) return null;

  const card = state.lanes[fromLane].cards[side].find((c) => c.uid === uid);
  if (!card) return null;

  const withoutSource = removeRevealedFromSide(state, fromLane, side, uid);
  const withTarget = appendRevealedToSide(withoutSource, toLane, side, card);

  const placed = withTarget.lanes[toLane].cards[side].some((c) => c.uid === uid);
  if (!placed) return null;

  return withTarget;
}

/** Autre lieu avec au moins une place libre sur ce côté (révélées + en attente). */
export function pickRelocationLane(
  state: GameState,
  fromLane: LocationIndex,
  side: PlayerId,
): LocationIndex | null {
  const candidates = ([0, 1, 2] as LocationIndex[]).filter(
    (l) => l !== fromLane && canFitAdditionalCardOnSide(state, l, side),
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

/** Nombre de cartes qu’on peut encore ajouter sur ce côté (révélées). */
export function freeRevealedSlotsOnSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
): number {
  return Math.max(
    0,
    LANE_CAPACITY - countRevealedOnSide(state, lane, side),
  );
}
