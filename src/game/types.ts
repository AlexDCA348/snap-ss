export type Faction =
  | 'bronze'
  | 'black'
  | 'silver'
  | 'gold'
  | 'specter'
  | 'marina'
  | 'asgard'
  | 'god'
  | 'neutral';

export type AbilityKind = 'on-reveal' | 'ongoing' | 'on-destroy' | 'end-reveal';

export interface Ability {
  kind: AbilityKind;
  /** Identifier into the abilities registry (see abilities.ts). */
  id: string;
  /** Human readable description shown on the card. */
  text: string;
  /** Optional payload (e.g. amount, target). */
  params?: Record<string, number | string>;
}

export interface CardDefinition {
  id: string;
  name: string;
  /** Cost in Cosmos. */
  cost: number;
  /** Base power. */
  power: number;
  faction: Faction;
  ability?: Ability;
  /** Short flavor line. */
  flavor?: string;
  /** Optional asset filename (placeholder). */
  art?: string;
}

/**
 * A card in play / in hand: a copy of the definition with a unique instance id
 * and any per-game mutations (current power, revealed flag, etc.).
 */
export interface CardInstance {
  /** Unique instance id (so duplicates can coexist). */
  uid: string;
  defId: string;
  ownerId: PlayerId;
  /** Current power, after on-reveal mutations (does NOT include ongoing buffs). */
  basePower: number;
  /** Turn the card was played, used for stable ordering on reveal. */
  playedTurn?: number;
  /** Lieu où la carte a été jouée (phase de jeu), pour Pont de Jamir etc. */
  playedLane?: LocationIndex;
  revealed: boolean;
  /** Cygne effect: this card's ongoing is suppressed while in play. */
  silenced?: boolean;
  /**
   * Once-per-game ability flag (e.g. Phénix). Persists when the card returns
   * to the deck so it cannot retrigger.
   */
  abilityUsed?: boolean;
  /** Jeton Illusion de Saga (0 pwr) — lié au vrai Saga des Gémeaux. */
  sagaIllusion?: boolean;
  /** Uid de la carte jumelle (vrai Saga ↔ illusion). */
  sagaTwinUid?: string;
}

export type PlayerId = 'player' | 'ai';

export interface PlayerState {
  id: PlayerId;
  cosmos: number;
  maxCosmos: number;
  /** Next turn temporary cosmos bonus (e.g. Kiki). */
  nextTurnCosmosBonus?: number;
  /** Pre-instantiated cards waiting to be drawn (preserves per-instance flags). */
  deck: CardInstance[];
  hand: CardInstance[];
  /** Cards committed to lanes this turn but not yet revealed. */
  pending: Record<LocationIndex, CardInstance[]>;
}

export type LocationIndex = 0 | 1 | 2;

export type LocationEffectKind =
  | 'ongoing'
  | 'on-reveal'
  | 'end-reveal'
  | 'restriction'
  | 'cosmos'
  | 'setup';

export interface LocationEffect {
  id: string;
  kind: LocationEffectKind;
  text: string;
  params?: Record<string, number | string>;
}

export interface LocationDefinition {
  id: string;
  name: string;
  description?: string;
  effect?: LocationEffect;
}

export interface LaneState {
  /** Cards revealed at this lane, by player. */
  cards: Record<PlayerId, CardInstance[]>;
}

export type Phase =
  | 'setup'
  | 'play' // both players queue cards
  | 'reveal' // resolution
  | 'ended';

export interface GameLogEntry {
  turn: number;
  text: string;
}

export type GameMode = 'standard' | 'infinity';

export interface GameState {
  turn: number; // 1..6
  maxTurns: number;
  phase: Phase;
  /** Mode de partie — infinity = sandbox (cosmos infini, pas de récompenses). */
  mode: GameMode;
  players: Record<PlayerId, PlayerState>;
  locations: LocationDefinition[]; // length 3
  lanes: LaneState[]; // length 3
  log: GameLogEntry[];
  /** Filled when phase === 'ended'. */
  winner?: PlayerId | 'draw';
  /** Lanes won by each player at game end (for end screen). */
  lanesWon?: Record<PlayerId, number>;
  /** Cards destroyed throughout the game (per side). Used by Hadès / Thanatos. */
  graveyard: Record<PlayerId, CardInstance[]>;
  /** Total de cartes détruites (tous emplacements : plateau, main, deck). */
  totalDestroyed: number;
  /** Somme des puissances des cartes détruites pendant la partie. */
  totalDestroyedPower: number;
}

export const LANE_CAPACITY = 4;
