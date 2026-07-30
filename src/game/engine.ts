import {
  type CardDefinition,
  type CardInstance,
  type GameState,
  type LaneState,
  type LocationIndex,
  type PlayerId,
  type PlayerState,
} from './types';
import { getCardDef } from './cards';
import { shuffleBuildableIds } from './deckPool';
import { LOCATIONS } from './locations';
import {
  applyJamianEndOfReveal,
  applyTicks,
  computeOngoing,
  getEffectiveHandCost,
  isIndestructible,
} from './abilities';
import { scoringPower } from './sagaIllusion';
import { appendRevealedToSide, canPlaceCardOnSide } from './laneRules';
import {
  applyLocationEndOfReveal,
  applyLocationSetupEffects,
  resolveRevealedCardOnLane,
  getLaneMaxCost,
  getLaneMinCost,
} from './locationEffects';

const STARTING_HAND = 3;
const MAX_TURNS = 6;
/** Cosmos disponible chaque tour en mode Infinity (sandbox). */
export const INFINITY_COSMOS = 99;

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `c${uidCounter}`;
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildRandomDeck(): string[] {
  return shuffleBuildableIds();
}

function instantiate(defId: string, ownerId: PlayerId): CardInstance {
  const def = getCardDef(defId);
  return {
    uid: nextUid(),
    defId: def.id,
    ownerId,
    basePower: def.power,
    revealed: false,
  };
}

function emptyPending(): Record<LocationIndex, CardInstance[]> {
  return { 0: [], 1: [], 2: [] };
}

function emptyLane(): LaneState {
  return { cards: { player: [], ai: [] } };
}

/** Mélange les defIds puis répartit main + pile deck — ordre du builder ignoré en partie. */
function makePlayerFromDeckIds(
  id: PlayerId,
  deckIds: string[],
  startingHandSize: number = STARTING_HAND,
): PlayerState {
  const shuffledIds = shuffle(deckIds);
  const instances = shuffledIds.map((defId) => instantiate(defId, id));
  const handSize = Math.min(Math.max(0, startingHandSize), instances.length);
  return {
    id,
    cosmos: 0,
    maxCosmos: 0,
    deck: instances.slice(handSize),
    hand: instances.slice(0, handSize),
    pending: emptyPending(),
  };
}

/** Deck aléatoire du pool buildable (IA ou repli joueur). */
export function buildRandomDeckForGame(): string[] {
  return buildRandomDeck();
}

export interface CreateInitialStateOptions {
  playerDeckIds?: string[];
  aiDeckIds?: string[];
  mode?: 'standard' | 'infinity';
}

export function createInitialState(
  options?: CreateInitialStateOptions,
): GameState {
  uidCounter = 0;
  const mode = options?.mode ?? 'standard';
  const infinity = mode === 'infinity';
  const playerIds =
    options?.playerDeckIds && options.playerDeckIds.length > 0
      ? options.playerDeckIds
      : buildRandomDeck();
  // IA : nouveau deck tiré du pool à chaque partie (sauf override explicite).
  const aiIds = options?.aiDeckIds ?? buildRandomDeck();
  const playerHandSize = infinity ? playerIds.length : STARTING_HAND;
  const player = makePlayerFromDeckIds('player', playerIds, playerHandSize);
  const ai = makePlayerFromDeckIds('ai', aiIds);
  const locations = shuffle(LOCATIONS).slice(0, 3);
  let state: GameState = {
    turn: 0,
    maxTurns: MAX_TURNS,
    phase: 'setup',
    mode,
    players: { player, ai },
    locations,
    lanes: [emptyLane(), emptyLane(), emptyLane()],
    log: [
      {
        turn: 0,
        text: infinity
          ? 'Mode Infinity — cosmos illimité, main complète.'
          : 'La cosmoénergie s\u2019éveille...',
      },
    ],
    graveyard: { player: [], ai: [] },
    totalDestroyed: 0,
    totalDestroyedPower: 0,
  };
  state = applyLocationSetupEffects(state);
  return startNextTurn(state);
}

function drawOne(p: PlayerState): PlayerState {
  if (p.deck.length === 0) return p;
  const [next, ...rest] = p.deck;
  return {
    ...p,
    deck: rest,
    hand: [...p.hand, next],
  };
}

export function startNextTurn(state: GameState): GameState {
  if (state.turn >= state.maxTurns) {
    return endGame(state);
  }
  const turn = state.turn + 1;
  const infinity = state.mode === 'infinity';
  const playerBonus = state.players.player.nextTurnCosmosBonus ?? 0;
  const aiBonus = state.players.ai.nextTurnCosmosBonus ?? 0;
  const playerCosmos = infinity ? INFINITY_COSMOS : turn + playerBonus;
  const aiCosmos = infinity ? INFINITY_COSMOS : turn + aiBonus;
  const newPlayers: Record<PlayerId, PlayerState> = {
    player: drawOne({
      ...state.players.player,
      cosmos: playerCosmos,
      maxCosmos: playerCosmos,
      nextTurnCosmosBonus: 0,
      pending: emptyPending(),
    }),
    ai: drawOne({
      ...state.players.ai,
      cosmos: aiCosmos,
      maxCosmos: aiCosmos,
      nextTurnCosmosBonus: 0,
      pending: emptyPending(),
    }),
  };

  return {
    ...state,
    turn,
    phase: 'play',
    players: newPlayers,
    log: [
      ...state.log,
      {
        turn,
        text: infinity
          ? `Tour ${turn} — Cosmos ∞.`
          : playerBonus || aiBonus
            ? `Tour ${turn} — Cosmos ${turn} (+bonus).`
            : `Tour ${turn} — Cosmos ${turn}.`,
      },
    ],
  };
}

export function canPlay(
  state: GameState,
  playerId: PlayerId,
  uid: string,
  lane: LocationIndex,
): { ok: true } | { ok: false; reason: string } {
  if (state.phase !== 'play') return { ok: false, reason: 'Pas la phase de jeu.' };
  const p = state.players[playerId];
  const card = p.hand.find((c) => c.uid === uid);
  if (!card) return { ok: false, reason: 'Carte introuvable.' };
  const def = getCardDef(card.defId);
  const effectiveCost = getEffectiveHandCost(state, playerId, def.cost);
  if (effectiveCost > p.cosmos)
    return { ok: false, reason: 'Cosmos insuffisant.' };
  if (!canPlaceCardOnSide(state, lane, playerId))
    return { ok: false, reason: 'Lieu plein (4 cartes max de votre côté).' };
  const maxCost = getLaneMaxCost(state, lane);
  if (maxCost !== null && effectiveCost > maxCost)
    return {
      ok: false,
      reason: `Ce lieu n'accepte que les cartes de coût effectif ${maxCost} ou moins.`,
    };
  const minCost = getLaneMinCost(state, lane);
  if (minCost !== null && effectiveCost < minCost)
    return {
      ok: false,
      reason: `Ce lieu n'accepte que les cartes de coût effectif ${minCost} ou plus.`,
    };
  return { ok: true };
}

export function playCard(
  state: GameState,
  playerId: PlayerId,
  uid: string,
  lane: LocationIndex,
): GameState {
  const check = canPlay(state, playerId, uid, lane);
  if (!check.ok) return state;
  const p = state.players[playerId];
  const card = p.hand.find((c) => c.uid === uid)!;
  const def = getCardDef(card.defId);
  const effectiveCost = getEffectiveHandCost(state, playerId, def.cost);
  const newHand = p.hand.filter((c) => c.uid !== uid);
  const newPending: Record<LocationIndex, CardInstance[]> = {
    0: p.pending[0].slice(),
    1: p.pending[1].slice(),
    2: p.pending[2].slice(),
  };
  newPending[lane] = [
    ...newPending[lane],
    { ...card, playedTurn: state.turn, playedLane: lane },
  ];
  const updatedPlayer: PlayerState = {
    ...p,
    hand: newHand,
    cosmos: p.cosmos - effectiveCost,
    pending: newPending,
  };
  return {
    ...state,
    players: { ...state.players, [playerId]: updatedPlayer },
  };
}

export function unplayCard(
  state: GameState,
  playerId: PlayerId,
  uid: string,
): GameState {
  if (state.phase !== 'play') return state;
  const p = state.players[playerId];
  let foundLane: LocationIndex | null = null;
  let foundCard: CardInstance | null = null;
  for (const k of [0, 1, 2] as LocationIndex[]) {
    const found = p.pending[k].find((c) => c.uid === uid);
    if (found) {
      foundLane = k;
      foundCard = found;
      break;
    }
  }
  if (foundLane === null || !foundCard) return state;
  if (isIndestructible(state, foundCard, foundLane)) return state;
  const def = getCardDef(foundCard.defId);
  const effectiveCost = getEffectiveHandCost(state, playerId, def.cost);
  const newPending: Record<LocationIndex, CardInstance[]> = {
    0: p.pending[0].slice(),
    1: p.pending[1].slice(),
    2: p.pending[2].slice(),
  };
  newPending[foundLane] = newPending[foundLane].filter((c) => c.uid !== uid);
  const updated: PlayerState = {
    ...p,
    cosmos: p.cosmos + effectiveCost,
    pending: newPending,
    hand: [...p.hand, foundCard],
  };
  return { ...state, players: { ...state.players, [playerId]: updated } };
}

/**
 * Run the reveal phase: move pending cards into lanes, trigger on-reveal abilities,
 * recompute ongoing buffs and check for end of game.
 */
export function getRevealOrder(state: GameState): PlayerId[] {
  const score = scoreSnapshot(state);
  const playerTotal = score.totalPower.player;
  const aiTotal = score.totalPower.ai;
  if (playerTotal === aiTotal) {
    // Ordre fixe pour rejouer les révélés (VFX) de façon cohérente.
    return state.turn % 2 === 0 ? ['player', 'ai'] : ['ai', 'player'];
  }
  return playerTotal > aiTotal ? ['player', 'ai'] : ['ai', 'player'];
}

/** Révélations + effets de fin de lieu, avant le retour en main de Jamian. */
export function revealPhaseUntilJamian(state: GameState): GameState {
  let s: GameState = { ...state, phase: 'reveal' };
  const order = getRevealOrder(s);

  for (const pid of order) {
    const pending = s.players[pid].pending;
    for (const k of [0, 1, 2] as LocationIndex[]) {
      for (const card of pending[k]) {
        const revealed: CardInstance = { ...card, revealed: true };
        s = appendRevealedToSide(s, k, pid, revealed);
        s = resolveRevealedCardOnLane(s, k, revealed.uid, pid);
      }
    }
    s = {
      ...s,
      players: {
        ...s.players,
        [pid]: { ...s.players[pid], pending: emptyPending() },
      },
    };
  }

  s = dedupeHandCardsFromLanes(s);

  for (const k of [0, 1, 2] as LocationIndex[]) {
    s = applyLocationEndOfReveal(s, k);
  }

  return s;
}

export function revealPhase(state: GameState): GameState {
  let s = revealPhaseUntilJamian(state);
  s = applyJamianEndOfReveal(s);
  s = applyTicks(s);

  s = {
    ...s,
    log: [...s.log, { turn: s.turn, text: 'Les cosmos s\u2019affrontent !' }],
  };

  if (s.turn >= s.maxTurns) {
    return endGame(s);
  }
  return startNextTurn(s);
}

function dedupeHandCardsFromLanes(state: GameState): GameState {
  const inHand = new Set<string>();
  for (const c of state.players.player.hand) inHand.add(c.uid);
  for (const c of state.players.ai.hand) inHand.add(c.uid);
  if (inHand.size === 0) return state;
  const newLanes = state.lanes.map((lane) => ({
    cards: {
      player: lane.cards.player.filter((c) => !inHand.has(c.uid)),
      ai: lane.cards.ai.filter((c) => !inHand.has(c.uid)),
    },
  })) as LaneState[];
  return { ...state, lanes: newLanes };
}


export function endTurn(state: GameState): GameState {
  if (state.phase !== 'play') return state;
  return revealPhase(state);
}

interface ScoreSnapshot {
  lanePower: Array<Record<PlayerId, number>>;
  totalPower: Record<PlayerId, number>;
}

/**
 * Compute power per lane / total, taking ongoing abilities into account.
 * This is the canonical source for what the UI should display.
 */
export function scoreSnapshot(state: GameState): ScoreSnapshot {
  const ongoing = computeOngoing(state);
  const lanePower: Array<Record<PlayerId, number>> = [];
  const totalPower: Record<PlayerId, number> = { player: 0, ai: 0 };
  for (let i = 0; i < 3; i += 1) {
    const lane = state.lanes[i];
    const pPow = sumLanePower(lane.cards.player, ongoing, state);
    const aPow = sumLanePower(lane.cards.ai, ongoing, state);
    lanePower.push({ player: pPow, ai: aPow });
    totalPower.player += pPow;
    totalPower.ai += aPow;
  }
  return { lanePower, totalPower };
}

function sumLanePower(
  cards: CardInstance[],
  ongoing: ReturnType<typeof computeOngoing>,
  state: GameState,
): number {
  return cards.reduce((acc, c) => acc + scoringPower(state, c, ongoing), 0);
}

export function getLaneWinner(
  state: GameState,
  lane: LocationIndex,
): PlayerId | 'tie' {
  const snap = scoreSnapshot(state);
  const p = snap.lanePower[lane].player;
  const a = snap.lanePower[lane].ai;
  if (p > a) return 'player';
  if (a > p) return 'ai';
  return 'tie';
}

export function endGame(state: GameState): GameState {
  const lanesWon: Record<PlayerId, number> = { player: 0, ai: 0 };
  for (const i of [0, 1, 2] as LocationIndex[]) {
    const w = getLaneWinner(state, i);
    if (w !== 'tie') lanesWon[w] += 1;
  }
  let winner: PlayerId | 'draw';
  if (lanesWon.player > lanesWon.ai) winner = 'player';
  else if (lanesWon.ai > lanesWon.player) winner = 'ai';
  else {
    // tiebreak on total power
    const snap = scoreSnapshot(state);
    if (snap.totalPower.player > snap.totalPower.ai) winner = 'player';
    else if (snap.totalPower.ai > snap.totalPower.player) winner = 'ai';
    else winner = 'draw';
  }
  return {
    ...state,
    phase: 'ended',
    winner,
    lanesWon,
    log: [
      ...state.log,
      {
        turn: state.turn,
        text:
          winner === 'draw'
            ? 'Égalité cosmique.'
            : winner === 'player'
            ? 'Victoire du Sanctuaire (vous) !'
            : 'Victoire des forces adverses.',
      },
    ],
  };
}

export function definitionsInLane(lane: LaneState): {
  player: CardDefinition[];
  ai: CardDefinition[];
} {
  return {
    player: lane.cards.player.map((c) => getCardDef(c.defId)),
    ai: lane.cards.ai.map((c) => getCardDef(c.defId)),
  };
}
