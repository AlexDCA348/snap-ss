import { getCardDef } from './cards';
import {
  appendRevealedToSide,
  canAddRevealedToSide,
  canFitAdditionalCardOnSide,
  moveRevealedCard,
} from './laneRules';
import {
  applyOnReveal,
  currentPower,
  destroyAtLane,
  getEffectiveCost,
  isIndestructible,
  isLaneSilenced,
  isOnRevealDisabled,
  isProtected,
} from './abilities';
import type { CardInstance, GameState, LocationIndex, PlayerId } from './types';

function getLocationEffectId(
  state: GameState,
  lane: LocationIndex,
): string | null {
  return state.locations[lane]?.effect?.id ?? null;
}

type OngoingLaneHandler = (
  state: GameState,
  lane: LocationIndex,
) => Record<string, number>;

const ONGOING_LANE: Record<string, OngoingLaneHandler> = {
  /** Cinq Pics — +3 à la carte au coût imprimé le plus élevé par côté. */
  'loc-five-peaks-highest-cost': (state, lane) => {
    const amount = 3;
    const out: Record<string, number> = {};
    for (const side of ['player', 'ai'] as PlayerId[]) {
      const cards = state.lanes[lane].cards[side];
      if (cards.length === 0) continue;
      const maxCost = Math.max(...cards.map((c) => getCardDef(c.defId).cost));
      for (const c of cards) {
        if (getCardDef(c.defId).cost === maxCost) {
          out[c.uid] = (out[c.uid] ?? 0) + amount;
        }
      }
    }
    return out;
  },

  /** La Plage — +1 aux Chevaliers d'Argent. */
  'loc-beach-silver': (state, lane) => {
    const amount = 1;
    const out: Record<string, number> = {};
    for (const side of ['player', 'ai'] as PlayerId[]) {
      for (const c of state.lanes[lane].cards[side]) {
        if (getCardDef(c.defId).faction === 'silver') {
          out[c.uid] = (out[c.uid] ?? 0) + amount;
        }
      }
    }
    return out;
  },

  /** La vallée de la mort — −1 aux cartes non Noires. */
  'loc-death-valley-debuff-non-black': (state, lane) => {
    const amount = -1;
    const out: Record<string, number> = {};
    for (const side of ['player', 'ai'] as PlayerId[]) {
      for (const c of state.lanes[lane].cards[side]) {
        if (getCardDef(c.defId).faction !== 'black') {
          out[c.uid] = (out[c.uid] ?? 0) + amount;
        }
      }
    }
    return out;
  },

  /** Fondation Graad — +1 aux cartes sans effet. */
  'loc-graad-buff-no-ability': (state, lane) => {
    const amount = 1;
    const out: Record<string, number> = {};
    for (const side of ['player', 'ai'] as PlayerId[]) {
      for (const c of state.lanes[lane].cards[side]) {
        if (!getCardDef(c.defId).ability) {
          out[c.uid] = (out[c.uid] ?? 0) + amount;
        }
      }
    }
    return out;
  },
};

const GALACTIC_TOURNAMENT_EFFECT_ID = 'loc-galactic-tournament-double-on-reveal';
export const ANDROMEDA_ISLAND_EFFECT_ID = 'loc-andromeda-island-relocate';
export const JAMIR_NO_DECREASE_EFFECT_ID = 'loc-jamir-no-decrease';
export const JAMIR_BRIDGE_EFFECT_ID = 'loc-jamir-bridge-destroy-placed';

/** Jetons immunisés sur le Pont de Jamir (doubles, âmes perdues…). */
export function isJamirBridgeExempt(defId: string): boolean {
  return (
    defId.endsWith('-double') ||
    defId === 'lost-soul' ||
    defId === 'saga-illusion' ||
    defId === 'saga-double'
  );
}

/** @deprecated Préférer {@link isJamirBridgeExempt}. */
export function isJamirBridgeDoublon(defId: string): boolean {
  return defId.endsWith('-double');
}

/** Jamir — les cartes ici ne peuvent pas perdre de puissance. */
export function isJamirNoDecreaseLane(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isLaneSilenced(state, lane)) return false;
  return getLocationEffectId(state, lane) === JAMIR_NO_DECREASE_EFFECT_ID;
}

/** Restrictions de coût (Terrain d'entraînement, Palais du Grand Pope…). */
export function isCardAllowedByLaneRestrictions(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  card: CardInstance,
): boolean {
  const maxCost = getLaneMaxCost(state, lane);
  const minCost = getLaneMinCost(state, lane);
  if (maxCost === null && minCost === null) return true;

  const effectiveCost = getEffectiveCost(card, state, side);

  if (maxCost !== null && effectiveCost > maxCost) return false;
  if (minCost !== null && effectiveCost < minCost) return false;
  return true;
}

function pickRelocationLaneForCard(
  state: GameState,
  fromLane: LocationIndex,
  side: PlayerId,
  _card: CardInstance,
): LocationIndex | null {
  const candidates = ([0, 1, 2] as LocationIndex[]).filter((l) => {
    if (l === fromLane) return false;
    if (!canFitAdditionalCardOnSide(state, l, side)) return false;
    if (!canAddRevealedToSide(state, l, side)) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

function isValidRelocationTarget(
  state: GameState,
  fromLane: LocationIndex,
  side: PlayerId,
  targetLane: LocationIndex,
): boolean {
  if (targetLane === fromLane) return false;
  if (!canFitAdditionalCardOnSide(state, targetLane, side)) return false;
  if (!canAddRevealedToSide(state, targetLane, side)) return false;
  return true;
}

/** Île d'Andromède — déplace la carte révélée vers un autre lieu libre. */
export function applyLocationOnCardRevealed(
  state: GameState,
  lane: LocationIndex,
  _side: PlayerId,
  uid: string,
  forcedTargetLane?: LocationIndex,
): { state: GameState; lane: LocationIndex } {
  if (getLocationEffectId(state, lane) !== ANDROMEDA_ISLAND_EFFECT_ID) {
    return { state, lane };
  }

  const found = findRevealedCardOnLane(state, lane, uid);
  if (!found) return { state, lane };

  const cardSide = found.side;

  if (isIndestructible(state, found.card, lane)) {
    const cardName = getCardDef(found.card.defId).name;
    const fromName = state.locations[lane].name;
    return {
      state: {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${fromName} : ${cardName} ne peut pas être déplacé.`,
          },
        ],
      },
      lane,
    };
  }

  const targetLane =
    forcedTargetLane !== undefined &&
    isValidRelocationTarget(state, lane, cardSide, forcedTargetLane)
      ? forcedTargetLane
      : pickRelocationLaneForCard(state, lane, cardSide, found.card);
  if (targetLane === null) return { state, lane };

  const moved = moveRevealedCard(state, lane, targetLane, cardSide, uid);
  if (!moved) return { state, lane };

  const cardName = getCardDef(found.card.defId).name;
  const fromName = state.locations[lane].name;
  const toName = moved.locations[targetLane].name;

  return {
    state: {
      ...moved,
      log: [
        ...moved.log,
        {
          turn: moved.turn,
          text: `${fromName} : ${cardName} est déplacée vers ${toName}.`,
        },
      ],
    },
    lane: targetLane,
  };
}

/** Tournoi Galactique — les au révélé des cartes sur ce lieu se déclenchent deux fois. */
export function isGalacticTournamentDoubleOnReveal(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isOnRevealDisabled(state, lane)) return false;
  return getLocationEffectId(state, lane) === GALACTIC_TOURNAMENT_EFFECT_ID;
}

/** Carte révélée sur un lieu, quel que soit le camp (ex. Ichi après un switch). */
export function findRevealedCardOnLane(
  state: GameState,
  lane: LocationIndex,
  uid: string,
): { card: CardInstance; side: PlayerId } | null {
  for (const side of ['player', 'ai'] as PlayerId[]) {
    const card = state.lanes[lane].cards[side].find((c) => c.uid === uid);
    if (card) return { card, side };
  }
  return null;
}

/**
 * Applique l'effet au révélé d'une carte, puis une seconde fois sur le Tournoi
 * Galactique. Cherche la carte par uid sur les deux camps entre chaque passe.
 */
export function applyCardRevealEffects(
  state: GameState,
  lane: LocationIndex,
  uid: string,
  originalSide: PlayerId,
): GameState {
  if (isOnRevealDisabled(state, lane)) return state;

  let s = state;
  const first =
    s.lanes[lane].cards[originalSide].find((c) => c.uid === uid) ??
    findRevealedCardOnLane(s, lane, uid)?.card;
  if (!first) return s;

  const def = getCardDef(first.defId);
  if (def.ability?.kind !== 'on-reveal') return s;

  const runPass = () => {
    const found = findRevealedCardOnLane(s, lane, uid);
    if (!found) return;
    s = applyOnReveal(s, found.card, lane);
  };

  runPass();

  if (isGalacticTournamentDoubleOnReveal(s, lane)) {
    const still = findRevealedCardOnLane(s, lane, uid);
    if (still && getCardDef(still.card.defId).ability?.kind === 'on-reveal') {
      runPass();
      s = {
        ...s,
        log: [
          ...s.log,
          {
            turn: s.turn,
            text: `${s.locations[lane].name} : au révélé de ${def.name} une seconde fois.`,
          },
        ],
      };
    }
  }

  return s;
}

/** Effets au révélé sur l'Île d'Andromède, puis relocation vers un autre lieu. */
export function resolveAndromedaRevealThenRelocate(
  state: GameState,
  lane: LocationIndex,
  uid: string,
  side: PlayerId,
  forcedTargetLane?: LocationIndex,
): { afterOnReveal: GameState; final: GameState } {
  let afterOnReveal = state;
  if (isOnRevealDisabled(state, lane)) {
    const found = findRevealedCardOnLane(state, lane, uid);
    if (
      found &&
      getCardDef(found.card.defId).ability?.kind === 'on-reveal'
    ) {
      afterOnReveal = {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `Un sceau empêche l’effet Au révélé à ${state.locations[lane].name}.`,
          },
        ],
      };
    }
  } else {
    afterOnReveal = applyCardRevealEffects(state, lane, uid, side);
  }

  const final = applyLocationOnCardRevealed(
    afterOnReveal,
    lane,
    side,
    uid,
    forcedTargetLane,
  ).state;
  return { afterOnReveal, final };
}

/** Effets au révélé, puis relocation sur l'Île d'Andromède. */
export function resolveRevealedCardOnLane(
  state: GameState,
  lane: LocationIndex,
  uid: string,
  side: PlayerId,
): GameState {
  if (getLocationEffectId(state, lane) === ANDROMEDA_ISLAND_EFFECT_ID) {
    return resolveAndromedaRevealThenRelocate(state, lane, uid, side).final;
  }

  if (isOnRevealDisabled(state, lane)) {
    const found = findRevealedCardOnLane(state, lane, uid);
    if (
      found &&
      getCardDef(found.card.defId).ability?.kind === 'on-reveal'
    ) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `Un sceau empêche l’effet Au révélé à ${state.locations[lane].name}.`,
          },
        ],
      };
    }
    return state;
  }

  return applyCardRevealEffects(state, lane, uid, side);
}

type EndRevealLaneHandler = (
  state: GameState,
  lane: LocationIndex,
) => GameState;

const END_REVEAL_LANE: Record<string, EndRevealLaneHandler> = {
  /**
   * Île de Death Queen — détruit l'ennemi le plus faible ici si :
   * - il y a des cartes des deux côtés (sinon personne en face → pas de cible) ;
   * - le côté ennemi compte au moins 2 cartes (la victime n'est pas seule sur son côté).
   */
  'loc-death-queen-destroy-weakest': (state, lane) => {
    const playerCards = state.lanes[lane].cards.player;
    const aiCards = state.lanes[lane].cards.ai;
    if (playerCards.length === 0 || aiCards.length === 0) {
      return state;
    }

    let next = state;
    const locName = state.locations[lane].name;
    let totalDestroyed = 0;
    const logStart = state.log.length;

    for (const side of ['player', 'ai'] as PlayerId[]) {
      const enemy: PlayerId = side === 'player' ? 'ai' : 'player';
      const enemies = next.lanes[lane].cards[enemy];
      if (enemies.length < 2) continue;
      const ranked = enemies
        .map((c) => ({ c, p: currentPower(next, c) }))
        .sort((a, b) => a.p - b.p);
      const target = ranked.find(({ c }) => !isProtected(next, c, lane))?.c;
      if (!target) continue;
      const result = destroyAtLane(
        next,
        lane,
        enemy,
        (c) => c.uid === target.uid,
      );
      next = result.state;
      totalDestroyed += result.destroyed.length;
    }

    if (next.log.length === logStart) return state;
    if (totalDestroyed === 0) return next;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${locName} : ${totalDestroyed} carte(s) ennemie(s) la(es) plus faible(s) détruite(s).`,
        },
      ],
    };
  },

  /**
   * Le 7e Sens — chaque joueur gagne, au tour suivant, +perCard Cosmos par
   * carte qu'il a posée SUR CE LIEU ce tour-ci (comptées parmi les cartes
   * révélées de son côté avec playedTurn = tour courant). Bonus consommé par
   * startNextTurn (même mécanisme que Kiki).
   */
  'loc-seventh-sense-cosmos-per-card': (state, lane) => {
    const effect = state.locations[lane]?.effect;
    const perCard =
      typeof effect?.params?.perCard === 'number' ? effect.params.perCard : 1;
    const players = { ...state.players };
    const gains: Record<PlayerId, number> = { player: 0, ai: 0 };
    for (const side of ['player', 'ai'] as PlayerId[]) {
      const placed = state.lanes[lane].cards[side].filter(
        (c) => c.playedTurn === state.turn,
      ).length;
      const bonus = placed * perCard;
      gains[side] = bonus;
      if (bonus > 0) {
        const p = players[side];
        players[side] = {
          ...p,
          nextTurnCosmosBonus: (p.nextTurnCosmosBonus ?? 0) + bonus,
        };
      }
    }
    if (gains.player === 0 && gains.ai === 0) return state;
    return {
      ...state,
      players,
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${state.locations[lane].name} : +${gains.player} Cosmos pour vous, +${gains.ai} pour l’adversaire au prochain tour.`,
        },
      ],
    };
  },

  /**
   * Pont de Jamir — détruit chaque carte jouée ici ce tour-ci, sauf :
   * - jetons « double » (asterion-double, black-dragon-double, etc.) ;
   * - âmes perdues (DeathMask) ;
   * - cartes indestructibles (ongoing-immune) ;
   * - cartes protégées par Mu (ou autre protecteur) via isProtected.
   */
  'loc-jamir-bridge-destroy-placed': (state, lane) => {
    const locName = state.locations[lane].name;
    let next = state;
    let totalDestroyed = 0;
    const logStart = state.log.length;

    for (const side of ['player', 'ai'] as PlayerId[]) {
      const result = destroyAtLane(
        next,
        lane,
        side,
        (c) =>
          c.playedTurn === state.turn &&
          c.playedLane === lane &&
          !isJamirBridgeExempt(c.defId),
      );
      next = result.state;
      totalDestroyed += result.destroyed.length;
    }

    if (next.log.length === logStart && totalDestroyed === 0) return state;
    if (totalDestroyed === 0) return next;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${locName} : ${totalDestroyed} carte(s) engloutie(s) par le gouffre.`,
        },
      ],
    };
  },
};

export const TRAINING_GROUND_EFFECT_ID = 'loc-training-ground-max-cost-3';
export const POPE_PALACE_EFFECT_ID = 'loc-pope-palace-min-cost-3';
export const SIBERIA_EFFECT_ID = 'loc-siberia-silence-ongoing';

/** Sibérie — les effets continus sont muets sur ce lieu (comme Camus). */
export function isSiberiaLocation(
  state: GameState,
  lane: LocationIndex,
): boolean {
  return getLocationEffectId(state, lane) === SIBERIA_EFFECT_ID;
}

/**
 * Coût maximum autorisé pour jouer une carte sur ce lieu (restriction), ou
 * `null` si le lieu n'impose aucune limite. Comparé au coût effectif en main.
 */
export function getLaneMaxCost(
  state: GameState,
  lane: LocationIndex,
): number | null {
  const effect = state.locations[lane]?.effect;
  if (!effect || effect.kind !== 'restriction') return null;
  if (effect.id === POPE_PALACE_EFFECT_ID) return null;
  if (effect.id === TRAINING_GROUND_EFFECT_ID) {
    return typeof effect.params?.maxCost === 'number' ? effect.params.maxCost : 2;
  }
  const maxCost = effect.params?.maxCost;
  return typeof maxCost === 'number' ? maxCost : null;
}

/**
 * Coût minimum autorisé pour jouer une carte sur ce lieu (restriction), ou
 * `null` si le lieu n'impose aucune limite basse. Comparé au coût effectif en main.
 */
export function getLaneMinCost(
  state: GameState,
  lane: LocationIndex,
): number | null {
  const effect = state.locations[lane]?.effect;
  if (!effect || effect.kind !== 'restriction') return null;
  if (effect.id === POPE_PALACE_EFFECT_ID) {
    return typeof effect.params?.minCost === 'number' ? effect.params.minCost : 3;
  }
  const minCost = effect.params?.minCost;
  return typeof minCost === 'number' ? minCost : null;
}

export const SANCTUARY_EFFECT_ID = 'loc-sanctuary-double-ongoing';

export function isSanctuaryLane(
  state: GameState,
  lane: LocationIndex,
  silencedLanes: Set<LocationIndex>,
): boolean {
  if (silencedLanes.has(lane)) return false;
  return getLocationEffectId(state, lane) === SANCTUARY_EFFECT_ID;
}

/** Modificateurs continus des lieux (fusionnés dans computeOngoing). */
export function applyLocationOngoingModifiers(
  state: GameState,
  silencedLanes: Set<LocationIndex>,
): Record<string, number> {
  const modifiers: Record<string, number> = {};
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (silencedLanes.has(l)) continue;
    const effectId = getLocationEffectId(state, l);
    if (!effectId) continue;
    const handler = ONGOING_LANE[effectId];
    if (!handler) continue;
    const partial = handler(state, l);
    for (const [uid, delta] of Object.entries(partial)) {
      modifiers[uid] = (modifiers[uid] ?? 0) + delta;
    }
  }
  return modifiers;
}

const TOKYO_BLACK_PHOENIX_DEF_ID = 'black-phoenix';

function spawnSetupToken(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  defId: string,
): GameState {
  if (!canAddRevealedToSide(state, lane, side)) return state;
  const def = getCardDef(defId);
  const token: CardInstance = {
    uid: `t${Math.random().toString(16).slice(2)}`,
    defId,
    ownerId: side,
    basePower: def.power,
    revealed: true,
    playedTurn: state.turn,
  };
  return appendRevealedToSide(state, lane, side, token);
}

/** Effets de lieu au début de la partie (après tirage des 3 lieux). */
export function applyLocationSetupEffects(state: GameState): GameState {
  const hasTokyo = state.locations.some(
    (loc) => loc.effect?.id === 'loc-tokyo-spawn-black-phoenix',
  );
  if (!hasTokyo) return state;

  let next = state;
  for (const lane of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      next = spawnSetupToken(next, lane, side, TOKYO_BLACK_PHOENIX_DEF_ID);
    }
  }

  return {
    ...next,
    log: [
      ...next.log,
      {
        turn: next.turn,
        text: 'Tokyo : un Phénix Noir apparaît sur chaque lieu (chaque camp).',
      },
    ],
  };
}

/** Fin de phase révélation, une fois par lieu. */
export function applyLocationEndOfReveal(
  state: GameState,
  lane: LocationIndex,
): GameState {
  const effectId = getLocationEffectId(state, lane);
  if (!effectId) return state;
  const handler = END_REVEAL_LANE[effectId];
  if (!handler) return state;
  return handler(state, lane);
}

/** Bonus heuristique IA : carte compatible avec le lieu. */
export function locationPlayBonus(
  state: GameState,
  lane: LocationIndex,
  defId: string,
): number {
  const effectId = getLocationEffectId(state, lane);
  if (!effectId) return 0;
  const def = getCardDef(defId);
  switch (effectId) {
    case 'loc-sanctuary-double-ongoing':
      return def.ability?.kind === 'ongoing' ? 4 : 1;
    case 'loc-five-peaks-highest-cost':
      return def.cost >= 4 ? 3 : def.cost >= 3 ? 1 : 0;
    case 'loc-galactic-tournament-double-on-reveal':
      return def.ability?.kind === 'on-reveal' ? 5 : 0;
    case 'loc-beach-silver':
      return def.faction === 'silver' ? 3 : 0;
    case 'loc-death-queen-destroy-weakest':
      return 1;
    case 'loc-jamir-no-decrease':
      return 2;
    case 'loc-death-valley-debuff-non-black':
      return def.faction === 'black' ? 4 : -2;
    case 'loc-training-ground-max-cost-3':
      return def.cost <= 2 ? 1 : 0;
    case 'loc-seventh-sense-cosmos-per-card':
      return 1;
    case 'loc-siberia-silence-ongoing':
      return def.ability?.kind === 'ongoing' ? -3 : 0;
    case 'loc-jamir-bridge-destroy-placed':
      return isJamirBridgeExempt(defId) ? 2 : -2;
    case 'loc-graad-buff-no-ability':
      return getCardDef(defId).ability ? 0 : 3;
    case 'loc-pope-palace-min-cost-3':
      return def.cost >= 3 ? 3 : def.cost <= 2 ? -3 : 0;
    case 'loc-andromeda-island-relocate':
      return 1;
    case 'loc-tokyo-spawn-black-phoenix':
      return def.faction === 'black' ? 2 : 0;
    default:
      return 0;
  }
}
