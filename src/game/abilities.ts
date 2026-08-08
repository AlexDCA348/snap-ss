import { getCardDef } from './cards';
import { NO_EFFECT_ZONE_LOCATION, OTHER_DIMENSION_LOCATION } from './locations';
import {
  applyLocationOngoingModifiers,
  isJamirNoDecreaseLane,
  isSanctuaryLane,
  isSiberiaLocation,
} from './locationEffects';
import {
  type CardInstance,
  type GameState,
  type LocationIndex,
  type PlayerId,
  LANE_CAPACITY,
} from './types';
import {
  appendRevealedToSide,
  canAddRevealedToSide,
  canFitAdditionalCardOnSide,
  freeRevealedSlotsOnSide,
} from './laneRules';
import { scoringPower } from './sagaIllusion';

/** Plafond def.cost + costDelta (Pégase Noir, etc.). */
export const MAX_CARD_COST = 7;

/**
 * On-reveal abilities mutate the lane state directly (typically by adjusting
 * a card's `basePower`). Ongoing abilities are pure: they produce a map of
 * per-card power modifiers from the current state. Tick abilities run once
 * per reveal phase to apply persistent side-effects (e.g. Milo).
 */

type OnRevealHandler = (
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
) => GameState;

const ON_REVEAL: Record<string, OnRevealHandler> = {
  /** Ban — pioche une carte du deck en main. */
  'ban-draw-from-deck': (state, source, _lane) => {
    const side = source.ownerId;
    const player = state.players[side];
    if (player.deck.length === 0) return state;

    const [drawn, ...rest] = player.deck;
    const toHand: CardInstance = {
      ...drawn,
      revealed: false,
      playedTurn: undefined,
      silenced: false,
    };
    const drawnName = getCardDef(drawn.defId).name;
    const sourceName = getCardDef(source.defId).name;

    return {
      ...state,
      players: {
        ...state.players,
        [side]: {
          ...player,
          deck: rest,
          hand: [...player.hand, toHand],
        },
      },
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${sourceName} pioche ${drawnName} depuis le deck.`,
        },
      ],
    };
  },

  /** Sirius — +N permanent à la carte au-dessus du deck. */
  'sirius-buff-top-deck': (state, source, _lane) => {
    const side = source.ownerId;
    const player = state.players[side];
    if (player.deck.length === 0) {
      const name = getCardDef(source.defId).name;
      return {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${name} : le deck est vide.`,
          },
        ],
      };
    }

    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 3;
    const [top, ...rest] = player.deck;
    const buffed: CardInstance = {
      ...top,
      basePower: top.basePower + amount,
    };
    const topName = getCardDef(top.defId).name;
    const sourceName = def.name;

    return {
      ...state,
      players: {
        ...state.players,
        [side]: {
          ...player,
          deck: [buffed, ...rest],
        },
      },
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${sourceName} : +${amount} à ${topName} (dessus du deck).`,
        },
      ],
    };
  },

  /** Babel — destroys a random enemy here with cost 1 or 2. */
  'destroy-enemy-cost-1-or-2-here': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const candidates = state.lanes[lane].cards[enemy].filter((c) => {
      const def = getCardDef(c.defId);
      return def.cost <= 2;
    });
    if (candidates.length === 0) return state;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const { state: next } = destroyAtLane(
      state,
      lane,
      enemy,
      (c) => c.uid === target.uid,
      source,
    );
    return next;
  },

  /** Moses — ajoute la carte du dessus du deck ici et joue son Au révélé. */
  'moses-place-top-deck-here': (state, source, lane) => {
    const side = source.ownerId;
    const name = getCardDef(source.defId).name;
    const player = state.players[side];

    if (player.deck.length === 0) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${name} : le deck est vide.`,
          },
        ],
      };
    }

    if (!canAddRevealedToSide(state, lane, side)) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${name} : plus de place ici.`,
          },
        ],
      };
    }

    const [top, ...rest] = player.deck;
    const placed: CardInstance = {
      ...top,
      revealed: true,
      playedTurn: state.turn,
      silenced: false,
    };
    const topName = getCardDef(top.defId).name;

    let next: GameState = {
      ...state,
      players: {
        ...state.players,
        [side]: { ...player, deck: rest },
      },
    };
    next = appendRevealedToSide(next, lane, side, placed);

    next = {
      ...next,
      log: [
        ...next.log,
        {
          turn: state.turn,
          text: `${name} ajoute ${topName} depuis le deck ici.`,
        },
      ],
    };

    return applyPulledCardOnReveal(next, lane, placed.uid);
  },

  /** Ptolemy — -3 to the weakest enemy here (permanent). */
  'debuff-weakest-enemy-here-3': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const weakest = enemies
      .map((c) => ({ c, p: currentPower(state, c) }))
      .sort((a, b) => a.p - b.p)[0].c;
    return adjustLanePower(
      state,
      lane,
      enemy,
      -3,
      (c) => c.uid === weakest.uid,
    );
  },

  /** Ichi — -1 to the weakest enemy here (permanent). */
  'debuff-weakest-enemy-here-1': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const weakest = enemies
      .map((c) => ({ c, p: currentPower(state, c) }))
      .sort((a, b) => a.p - b.p)[0].c;
    return adjustLanePower(
      state,
      lane,
      enemy,
      -1,
      (c) => c.uid === weakest.uid,
    );
  },

  /** Ichi — au révélé, rejoint le camp adverse sur ce lieu. */
  'ichi-switch-enemy-side': (state, source, lane) => {
    const from = source.ownerId;
    const to = otherPlayer(from);
    if (!canAddRevealedToSide(state, lane, to)) return state;

    const existing = state.lanes[lane].cards[from].find((c) => c.uid === source.uid);
    if (!existing) return state;

    const transferred: CardInstance = {
      ...existing,
      ownerId: to,
    };

    let next = removeRevealedFromSide(state, lane, from, source.uid);
    next = appendRevealedToSide(next, lane, to, transferred);

    const def = getCardDef(source.defId);
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${def.name} passe du côté adverse.`,
        },
      ],
    };
  },

  /** Capella — détruit les autres alliés ici ; +2 par carte détruite. */
  'capella-destroy-allies-buff': (state, source, lane) => {
    const { state: afterDestroy, destroyed } = destroyAtLane(
      state,
      lane,
      source.ownerId,
      (c) => c.uid !== source.uid,
      source,
    );
    if (destroyed.length === 0) return state;

    const def = getCardDef(source.defId);
    const perDestroy = (def.ability?.params?.perDestroy as number) ?? 2;
    const bonus = destroyed.length * perDestroy;
    const capella = afterDestroy.lanes[lane].cards[source.ownerId].find(
      (c) => c.uid === source.uid,
    );
    if (!capella) return afterDestroy;

    const next = updateCardInLane(afterDestroy, lane, source.ownerId, source.uid, {
      ...capella,
      basePower: capella.basePower + bonus,
    });

    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${def.name} tranche ${destroyed.length} allié(s) : +${bonus} pwr.`,
        },
      ],
    };
  },

  /**
   * Guilty — détruit les autres alliés ici, puis absorbe la somme de leurs
   * puissances (calculée avant destruction). Guilty n’est jamais ciblé.
   */
  'guilty-sacrifice-allies-absorb': (state, source, lane) => {
    const side = source.ownerId;
    const allies = state.lanes[lane].cards[side].filter(
      (c) => c.uid !== source.uid,
    );
    if (allies.length === 0) return state;

    const powerBefore = new Map(
      allies.map((c) => [c.uid, currentPower(state, c)] as const),
    );

    const { state: afterDestroy, destroyed } = destroyAtLane(
      state,
      lane,
      side,
      (c) => c.uid !== source.uid,
      source,
    );
    if (destroyed.length === 0) return afterDestroy;

    const gained = destroyed.reduce(
      (sum, card) => sum + (powerBefore.get(card.uid) ?? 0),
      0,
    );

    const guilty = afterDestroy.lanes[lane].cards[side].find(
      (c) => c.uid === source.uid,
    );
    if (!guilty) return afterDestroy;

    const next = updateCardInLane(afterDestroy, lane, side, source.uid, {
      ...guilty,
      basePower: guilty.basePower + gained,
    });

    const def = getCardDef(source.defId);
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${def.name} consume ${destroyed.length} allié(s) : +${gained} pwr.`,
        },
      ],
    };
  },

  /** Dante — détruit toutes les cartes de coût 1 (alliés et ennemis) sur tous les lieux. */
  'dante-destroy-cost-1-all-lanes': (state, source, lane) => {
    void lane;
    let next = state;
    let total = 0;

    for (const l of [0, 1, 2] as LocationIndex[]) {
      for (const side of ['player', 'ai'] as PlayerId[]) {
        const result = destroyAtLane(
          next,
          l,
          side,
          (c) => c.uid !== source.uid && getCardDef(c.defId).cost === 1,
          source,
        );
        next = result.state;
        total += result.destroyed.length;
      }
    }

    if (total === 0) return state;

    const name = getCardDef(source.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} enchaîne ${total} carte(s) de coût 1 sur le plateau.`,
        },
      ],
    };
  },

  /** Astérion — remplit ce lieu de doubles sans effet (jusqu’à la capacité). */
  'asterion-create-double': (state, source, lane) => {
    const slots = freeRevealedSlotsOnSide(state, lane, source.ownerId);
    if (slots <= 0) return state;
    const tokenDef = getCardDef('asterion-double');
    let next = state;
    let added = 0;
    for (let i = 0; i < slots; i += 1) {
      if (!canAddRevealedToSide(next, lane, source.ownerId)) break;
      const token: CardInstance = {
        uid: `d${Math.random().toString(16).slice(2)}${i}`,
        defId: 'asterion-double',
        ownerId: source.ownerId,
        basePower: tokenDef.power,
        revealed: true,
        playedTurn: state.turn,
      };
      next = appendRevealedToSide(next, lane, source.ownerId, token);
      added += 1;
    }
    if (added === 0) return state;
    const name = getCardDef(source.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} remplit le lieu de ${added} double(s).`,
        },
      ],
    };
  },

  /** Shaina — +N permanent à chaque allié d’une faction en jeu (tous les lieux). */
  'shaina-buff-silver-allies': (state, source) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    const faction = (def.ability?.params?.faction as string) ?? 'silver';
    let next = state;
    let hit = 0;
    for (const l of [0, 1, 2] as LocationIndex[]) {
      const allies = next.lanes[l].cards[source.ownerId].filter(
        (c) => getCardDef(c.defId).faction === faction,
      );
      if (allies.length === 0) continue;
      hit += allies.length;
      next = adjustLanePower(next, l, source.ownerId, amount, (c) => {
        return getCardDef(c.defId).faction === faction;
      });
    }
    if (hit === 0) return state;
    const name = getCardDef(source.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} : +${amount} à ${hit} Chevalier(s) d’Argent allié(s).`,
        },
      ],
    };
  },

  /** Roshi — +N permanent à chaque Chevalier allié (Bronze, Argent, Or) en jeu. */
  'reveal-buff-allied-knights': (state, source) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    const isKnight = (defId: string) => {
      const f = getCardDef(defId).faction;
      return f === 'bronze' || f === 'silver' || f === 'gold';
    };
    let next = state;
    let hit = 0;
    for (const l of [0, 1, 2] as LocationIndex[]) {
      const allies = next.lanes[l].cards[source.ownerId].filter((c) =>
        isKnight(c.defId),
      );
      if (allies.length === 0) continue;
      hit += allies.length;
      next = adjustLanePower(next, l, source.ownerId, amount, (c) =>
        isKnight(c.defId),
      );
    }
    if (hit === 0) return state;
    const name = getCardDef(source.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} : +${amount} à ${hit} Chevalier(s) de Bronze, d’Argent ou d’Or allié(s).`,
        },
      ],
    };
  },

  /** Orphée — la carte alliée la plus faible ici change de côté. */
  'orphee-switch-weakest-here': (state, source, lane) => {
    const from = source.ownerId;
    const to = otherPlayer(from);
    const allies = state.lanes[lane].cards[from].filter(
      (c) => c.uid !== source.uid,
    );
    if (allies.length === 0) return state;

    let weakest = allies[0];
    let weakestPower = currentPower(state, weakest);
    for (const card of allies.slice(1)) {
      const power = currentPower(state, card);
      if (power < weakestPower) {
        weakest = card;
        weakestPower = power;
      }
    }

    if (!canAddRevealedToSide(state, lane, to)) {
      const name = getCardDef(source.defId).name;
      return {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${name} : le côté adverse est plein, impossible de changer ${getCardDef(weakest.defId).name} de côté.`,
          },
        ],
      };
    }

    const transferred: CardInstance = {
      ...weakest,
      ownerId: to,
    };

    let next = removeRevealedFromSide(state, lane, from, weakest.uid);
    next = appendRevealedToSide(next, lane, to, transferred);

    const name = getCardDef(source.defId).name;
    const targetName = getCardDef(weakest.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} : ${targetName} (${weakestPower}) change de côté.`,
        },
      ],
    };
  },

  /** Kiki — grants +1 cosmos next turn to the owner. */
  'kiki-next-turn-cosmos': (state, source) => {
    const p = state.players[source.ownerId];
    const bonus = (p.nextTurnCosmosBonus ?? 0) + 1;
    return {
      ...state,
      players: {
        ...state.players,
        [source.ownerId]: { ...p, nextTurnCosmosBonus: bonus },
      },
      log: [
        ...state.log,
        { turn: state.turn, text: 'Kiki prépare +1 Cosmos pour le prochain tour.' },
      ],
    };
  },

  /** Grand Pope Shion — autre dimension (lieu neutre) + partie en 7 tours. */
  'grand-pope-other-dimension': (state, source, lane) => {
    const prev = state.locations[lane];
    const popeName = getCardDef(source.defId).name;
    const nextMax = Math.max(state.maxTurns, 7);
    const locations = state.locations.map((loc, i) =>
      i === lane ? { ...OTHER_DIMENSION_LOCATION } : loc,
    );
    const log = [...state.log];
    if (prev.id !== OTHER_DIMENSION_LOCATION.id) {
      log.push({
        turn: state.turn,
        text: `${popeName} transforme ${prev.name} en une autre dimension : plus d'effet de lieu.`,
      });
    }
    if (nextMax > state.maxTurns) {
      log.push({
        turn: state.turn,
        text: 'La partie dure désormais 7 tours.',
      });
    }
    if (
      prev.id === OTHER_DIMENSION_LOCATION.id &&
      nextMax === state.maxTurns
    ) {
      return state;
    }
    return { ...state, locations, maxTurns: nextMax, log };
  },

  /** Marine de l'Aigle — transforme ce lieu en zone sans effet. */
  'marine-neutralize-location': (state, _source, lane) => {
    const prev = state.locations[lane];
    if (prev.id === NO_EFFECT_ZONE_LOCATION.id) return state;
    const locations = state.locations.map((loc, i) =>
      i === lane ? { ...NO_EFFECT_ZONE_LOCATION } : loc,
    );
    return {
      ...state,
      locations,
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `La Marine de l'Aigle neutralise ${prev.name} : plus d'effet de lieu.`,
        },
      ],
    };
  },

  /** DeathMask — adds a 1-power Lost Soul on each other lane for both sides. */
  'deathmask-add-lost-souls': (state, source, lane) => {
    let s = state;
    for (const l of [0, 1, 2] as LocationIndex[]) {
      if (l === lane) continue;
      s = addTokenToLane(s, l, 'player', 'lost-soul', source);
      s = addTokenToLane(s, l, 'ai', 'lost-soul', source);
    }
    return s;
  },

  /** Saga — illusion 0 pwr dans un autre lieu ; l’adversaire ne distingue plus le vrai Saga. */
  'saga-create-illusion': (state, source, lane) => {
    const otherLanes = ([0, 1, 2] as LocationIndex[]).filter(
      (l) =>
        l !== lane && canAddRevealedToSide(state, l, source.ownerId),
    );
    if (otherLanes.length === 0) return state;

    const targetLane =
      otherLanes[Math.floor(Math.random() * otherLanes.length)];
    const illusionUid = `si${Math.random().toString(16).slice(2)}`;
    const illusion: CardInstance = {
      uid: illusionUid,
      defId: 'saga-illusion',
      ownerId: source.ownerId,
      basePower: 0,
      revealed: true,
      playedTurn: state.turn,
      sagaIllusion: true,
      sagaTwinUid: source.uid,
    };

    const realSaga: CardInstance = {
      ...source,
      sagaTwinUid: illusionUid,
    };

    let next = updateCardInLane(state, lane, source.ownerId, source.uid, realSaga);
    next = appendRevealedToSide(next, targetLane, source.ownerId, illusion);

    const def = getCardDef(source.defId);
    const locName = next.locations[targetLane].name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${def.name} crée une illusion sur ${locName}.`,
        },
      ],
    };
  },

  /** Shura — ajoute une carte du deck adverse de son côté ici, la détruit si puissance inférieure. */
  'shura-reveal-and-destroy': (state, source, lane) =>
    resolveShuraRevealThenDestroy(state, source, lane).final,

  'debuff-strongest-enemy-here': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 2;
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const ongoing = computeOngoing(state).modifiers;
    const strongest = enemies
      .map((c) => ({ c, p: c.basePower + (ongoing[c.uid] ?? 0) }))
      .sort((a, b) => b.p - a.p)[0].c;
    return adjustLanePower(
      state,
      lane,
      enemy,
      -amount,
      (c) => c.uid === strongest.uid,
    );
  },

  /** Milo — −N permanent à toutes les cartes adverses sur ce lieu. */
  'debuff-all-enemies-2': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 2;
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const next = adjustLanePower(state, lane, enemy, -amount);
    const name = getCardDef(source.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} : −${amount} permanent à toutes les cartes adverses ici (${enemies.length}).`,
        },
      ],
    };
  },

  'destroy-weakest-enemy-here': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const weakest = enemies
      .map((c) => ({ c, p: currentPower(state, c) }))
      .sort((a, b) => a.p - b.p)[0].c;
    const { state: next } = destroyAtLane(
      state,
      lane,
      enemy,
      (c) => c.uid === weakest.uid,
      source,
    );
    return next;
  },

  'destroy-enemy-le-power-here': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const maxPower = (def.ability?.params?.maxPower as number) ?? 2;
    const enemy = otherPlayer(source.ownerId);
    const { state: next } = destroyAtLane(
      state,
      lane,
      enemy,
      (c) => currentPower(state, c) <= maxPower,
      source,
    );
    return next;
  },

  /** Aiolia — destroys ALL cards here with power < 4 (both sides), except itself. */
  'destroy-all-le4-here-except-self': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const maxPowerInclusive = (def.ability?.params?.maxPower as number) ?? 3; // 3 => "< 4"

    const shouldDestroy = (c: CardInstance) =>
      c.uid !== source.uid && currentPower(state, c) <= maxPowerInclusive;

    const enemy = otherPlayer(source.ownerId);
    const afterEnemy = destroyAtLane(state, lane, enemy, shouldDestroy, source)
      .state;
    const afterAlly = destroyAtLane(
      afterEnemy,
      lane,
      source.ownerId,
      shouldDestroy,
      source,
    ).state;
    return afterAlly;
  },

  /** Aiolos — destroys the strongest enemy in this lane, no condition. */
  'destroy-strongest-enemy-here': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const strongest = enemies
      .map((c) => ({ c, p: currentPower(state, c) }))
      .sort((a, b) => b.p - a.p)[0].c;
    const { state: next } = destroyAtLane(
      state,
      lane,
      enemy,
      (c) => c.uid === strongest.uid,
      source,
    );
    return next;
  },

  /** Cygne — silences a random opposing card in this lane that has an ongoing. */
  'silence-random-opposing-enemy': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const candidates = state.lanes[lane].cards[enemy].filter((c) => {
      if (c.silenced) return false;
      const def = getCardDef(c.defId);
      return def.ability?.kind === 'ongoing';
    });
    if (candidates.length === 0) return state;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const silenced: CardInstance = { ...target, silenced: true };
    const next = updateCardInLane(state, lane, enemy, target.uid, silenced);
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${getCardDef(source.defId).name} fige ${getCardDef(
            target.defId,
          ).name} dans un cercueil de glace.`,
        },
      ],
    };
  },

  /** Thanatos — resurrects a random destroyed ally into this lane. */
  'resurrect-random-destroyed-ally-here': (state, source, lane) => {
    const pool = state.graveyard[source.ownerId];
    if (pool.length === 0) return state;
    if (!canAddRevealedToSide(state, lane, source.ownerId)) return state;
    const idx = Math.floor(Math.random() * pool.length);
    const dead = pool[idx];
    const def = getCardDef(dead.defId);
    const revived: CardInstance = {
      ...dead,
      basePower: def.power,
      revealed: true,
      // Reset transient flags (Ikki rebirth keeps its doubled basePower).
      silenced: false,
      playedTurn: state.turn,
    };
    const newGraveyard = {
      ...state.graveyard,
      [source.ownerId]: pool.filter((_, i) => i !== idx),
    };
    const next = appendRevealedToSide(state, lane, source.ownerId, revived);
    return {
      ...next,
      graveyard: newGraveyard,
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${getCardDef(source.defId).name} ressuscite ${def.name} !`,
        },
      ],
    };
  },

  /**
   * Pégase Noir — +2 coût (plafond def+delta = 7) à une carte
   * aléatoire de la main adverse.
   */
  'black-pegasus-raise-enemy-hand-cost': (state, source) => {
    const enemy = otherPlayer(source.ownerId);
    const hand = state.players[enemy].hand;
    if (hand.length === 0) return state;
    const target = hand[Math.floor(Math.random() * hand.length)];
    const def = getCardDef(target.defId);
    const current = def.cost + (target.costDelta ?? 0);
    const add = Math.min(2, Math.max(0, MAX_CARD_COST - current));
    if (add <= 0) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${getCardDef(source.defId).name} ne peut plus alourdir ${def.name}.`,
          },
        ],
      };
    }
    const nextHand = hand.map((c) =>
      c.uid === target.uid
        ? { ...c, costDelta: (c.costDelta ?? 0) + add }
        : c,
    );
    return {
      ...state,
      players: {
        ...state.players,
        [enemy]: { ...state.players[enemy], hand: nextHand },
      },
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${getCardDef(source.defId).name} alourdit ${def.name} (+${add} coût).`,
        },
      ],
    };
  },

  /** Cygnus Noir — +2 cosmos next turn, then self-destructs. */
  'cygnus-noir-cosmos-then-selfdestruct': (state, source, lane) => {
    const p = state.players[source.ownerId];
    const bonus = (p.nextTurnCosmosBonus ?? 0) + 2;
    const withCosmos: GameState = {
      ...state,
      players: {
        ...state.players,
        [source.ownerId]: { ...p, nextTurnCosmosBonus: bonus },
      },
      log: [
        ...state.log,
        { turn: state.turn, text: 'Cygnus Noir vole +2 Cosmos au prochain tour.' },
      ],
    };
    // Auto-destruction should ignore protection.
    return destroyAtLaneForced(
      withCosmos,
      lane,
      source.ownerId,
      (c) => c.uid === source.uid,
      source,
    ).state;
  },
};

/**
 * Apply on-reveal effect for a freshly-revealed card.
 */
export function applyOnReveal(
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
): GameState {
  const def = getCardDef(source.defId);
  if (!def.ability || def.ability.kind !== 'on-reveal') return state;
  const handler = ON_REVEAL[def.ability.id];
  if (!handler) return state;
  return handler(state, source, lane);
}

const JAMIAN_DEF_ID = 'jamian';

/**
 * Jamian — fin de révélation (toutes les cartes retournées) : +1 pwr,
 * retour en main sauf au dernier tour (reste sur le plateau).
 */
export function applyJamianEndOfReveal(state: GameState): GameState {
  const isLastTurn = state.turn >= state.maxTurns;
  let s = state;

  for (const lane of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      for (const card of [...s.lanes[lane].cards[side]]) {
        if (card.defId !== JAMIAN_DEF_ID) continue;
        if (card.playedTurn !== s.turn) continue;

        const boosted: CardInstance = { ...card, basePower: card.basePower + 1 };
        const name = getCardDef(card.defId).name;

        if (isLastTurn) {
          s = updateCardInLane(s, lane, side, card.uid, boosted);
          s = {
            ...s,
            log: [
              ...s.log,
              {
                turn: s.turn,
                text: `${name} gagne +1 pwr (dernier tour, reste sur le plateau).`,
              },
            ],
          };
          continue;
        }

        s = updateCardInLane(s, lane, side, card.uid, boosted);
        s = returnToHand(s, lane, side, boosted);
        s = {
          ...s,
          log: [
            ...s.log,
            { turn: s.turn, text: `${name} reprend son envol (+1 pwr).` },
          ],
        };
      }
    }
  }

  return s;
}

export interface OngoingResult {
  modifiers: Record<string, number>;
  /** Multiplicateur de puissance effective (défaut 1). Ex. Saga ×2 alliés. */
  multipliers: Record<string, number>;
  /** Bonus de puissance de lieu (ex. Andromède Noir +3 aux adjacents). */
  laneBonuses: Array<Record<PlayerId, number>>;
}

function emptyLaneBonuses(): Array<Record<PlayerId, number>> {
  return [
    { player: 0, ai: 0 },
    { player: 0, ai: 0 },
    { player: 0, ai: 0 },
  ];
}

/** Puissance affichée / utilisée pour les comparaisons (continus additifs puis ×). */
export function effectivePower(
  card: CardInstance,
  ongoing: OngoingResult,
): number {
  const base = card.basePower + (ongoing.modifiers[card.uid] ?? 0);
  const mult = ongoing.multipliers[card.uid] ?? 1;
  return base * mult;
}

type OngoingHandler = (
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
) => Record<string, number>;

const ONGOING: Record<string, OngoingHandler> = {
  'ongoing-buff-allies-here': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    const out: Record<string, number> = {};
    for (const c of state.lanes[lane].cards[source.ownerId]) {
      if (c.uid === source.uid) continue;
      out[c.uid] = (out[c.uid] ?? 0) + amount;
    }
    return out;
  },

  'ongoing-bonus-when-full': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 4;
    const allies = state.lanes[lane].cards[source.ownerId];
    if (allies.length < LANE_CAPACITY) return {};
    return { [source.uid]: amount };
  },

  /** Athéna — +N to every other ally in play, all lanes. */
  'ongoing-global-buff': (state, source) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    const out: Record<string, number> = {};
    for (const l of [0, 1, 2] as LocationIndex[]) {
      for (const c of state.lanes[l].cards[source.ownerId]) {
        if (c.uid === source.uid) continue;
        out[c.uid] = (out[c.uid] ?? 0) + amount;
      }
    }
    return out;
  },

  /** Pégase — +1 on self per ally Bronze in play (excludes self). */
  'ongoing-buff-self-per-faction-ally': (state, source) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    const faction = (def.ability?.params?.faction as string) ?? 'bronze';
    let count = 0;
    for (const l of [0, 1, 2] as LocationIndex[]) {
      for (const c of state.lanes[l].cards[source.ownerId]) {
        if (c.uid === source.uid) continue;
        if (getCardDef(c.defId).faction === faction) count += 1;
      }
    }
    if (count === 0) return {};
    return { [source.uid]: amount * count };
  },

  /** Grand Pope Arès — puissance = somme des puissances des cartes détruites. */
  'ongoing-power-equals-destroyed-total': (state, source) => {
    const total = state.totalDestroyedPower ?? 0;
    const delta = total - source.basePower;
    if (delta === 0) return {};
    return { [source.uid]: delta };
  },

  /** Jabu — +1 on self per other allied Bronze in play in other lanes. */
  'ongoing-jabu-flank': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    let count = 0;
    for (const l of [0, 1, 2] as LocationIndex[]) {
      if (l === lane) continue;
      for (const c of state.lanes[l].cards[source.ownerId]) {
        const cdef = getCardDef(c.defId);
        if (cdef.faction === 'bronze') count += 1;
      }
    }
    if (count === 0) return {};
    return { [source.uid]: amount * count };
  },

  /** Marine — +5 on self if Seiya is in play (allied side). */
  'ongoing-plus-if-seiya-in-play': (state, source) => {
    const found = hasCardInPlay(state, source.ownerId, 'seiya');
    return found ? { [source.uid]: 5 } : {};
  },

  /** Daidalos — +N to each allied card with no ability in play. */
  'ongoing-plus-per-ally-without-ability': (state, source) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 2;
    const out: Record<string, number> = {};
    for (const l of [0, 1, 2] as LocationIndex[]) {
      for (const c of state.lanes[l].cards[source.ownerId]) {
        if (!getCardDef(c.defId).ability) {
          out[c.uid] = (out[c.uid] ?? 0) + amount;
        }
      }
    }
    return out;
  },

  /** Aphrodite — −N à toutes les cartes sur ce lieu (alliés + ennemis), sauf elle-même. */
  'ongoing-debuff-enemies-here': (state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 1;
    const out: Record<string, number> = {};
    for (const c of [
      ...state.lanes[lane].cards.player,
      ...state.lanes[lane].cards.ai,
    ]) {
      if (c.uid === source.uid) continue;
      out[c.uid] = (out[c.uid] ?? 0) - amount;
    }
    return out;
  },

  'ongoing-dokko-buff-other-golds': (state, source) => {
    const out: Record<string, number> = {};
    for (const l of [0, 1, 2] as LocationIndex[]) {
      for (const c of state.lanes[l].cards[source.ownerId]) {
        if (c.uid === source.uid) continue;
        if (getCardDef(c.defId).faction !== 'gold') continue;
        out[c.uid] = (out[c.uid] ?? 0) + 1;
      }
    }
    return out;
  },

  /** Saga — ×2 puissance effective des autres alliés sur ce lieu. */
  'ongoing-double-allies-here': (state, source, lane) => {
    const out: Record<string, number> = {};
    for (const c of state.lanes[lane].cards[source.ownerId]) {
      if (c.uid === source.uid) continue;
      out[c.uid] = 2;
    }
    return out;
  },

  /**
   * Andromède Noir — bonus de lieu géré via LANE_ONGOING
   * (`ongoing-buff-adjacent-lanes`).
   */
  'ongoing-buff-adjacent-lanes': () => ({}),

  // Flag-based abilities: handled by `isProtected` / `computeOngoing` gating.
  // Registered as no-ops so they appear in the registry & ability text.
  'ongoing-immune': () => ({}),
  'ongoing-protect-allies-here': () => ({}),
  'ongoing-silence-lane': () => ({}),
  'ongoing-no-decrease-self': () => ({}),
  'ongoing-no-decrease-allies': () => ({}),
  'ongoing-disable-onreveal-here': () => ({}),
  'ongoing-tick-buff-self': () => ({}),
  'ongoing-tick-june-cosmos': () => ({}),
  'ongoing-reduce-cost-hand-deck': () => ({}),
  'ongoing-increase-enemy-hand-cost': () => ({}),
  'ongoing-tick-summon-double-once': () => ({}),
  /**
   * Nachi — appliqué en post-passe (`applyWinningLaneBonuses`) pour éviter
   * la récursion via lanePower / computeOngoing.
   */
  'ongoing-plus-if-winning-here': () => ({}),
};

/**
 * Pure recompute of all ongoing modifiers. Returns a map from card uid to
 * additional power. Should be called after any state change that affects
 * lane membership.
 */
const MULTIPLY_ONGOING = new Set(['ongoing-double-allies-here']);
const LANE_BONUS_ONGOING = new Set(['ongoing-buff-adjacent-lanes']);

type LaneOngoingHandler = (
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
) => Partial<Record<LocationIndex, number>>;

/** Effets continus qui ajoutent de la puissance à un lieu (pas à une carte). */
const LANE_ONGOING: Record<string, LaneOngoingHandler> = {
  /** Andromède Noir — +N à chaque lieu adjacent (côté propriétaire). */
  'ongoing-buff-adjacent-lanes': (_state, source, lane) => {
    const def = getCardDef(source.defId);
    const amount = (def.ability?.params?.amount as number) ?? 3;
    const out: Partial<Record<LocationIndex, number>> = {};
    for (const l of [0, 1, 2] as LocationIndex[]) {
      if (Math.abs(l - lane) === 1) out[l] = amount;
    }
    return out;
  },
};

/** Applique un bonus de lieu émis par une carte source. */
function applyLaneOngoingFromSource(
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
  laneBonuses: Array<Record<PlayerId, number>>,
  silencedLanes: Set<LocationIndex>,
): void {
  const def = getCardDef(source.defId);
  if (!def.ability || def.ability.kind !== 'ongoing') return;
  const handler = LANE_ONGOING[def.ability.id];
  if (!handler) return;
  if (source.silenced || silencedLanes.has(lane)) return;
  const partial = handler(state, source, lane);
  for (const [laneKey, amount] of Object.entries(partial)) {
    if (!amount) continue;
    const targetLane = Number(laneKey) as LocationIndex;
    const bucket = laneBonuses[targetLane];
    if (!bucket) continue;
    bucket[source.ownerId] += amount;
  }
}

/** Applique l'effet continu d'une carte source (additif ou multiplicateur). */
function applyOngoingFromSource(
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
  modifiers: Record<string, number>,
  multipliers: Record<string, number>,
  uidIndex: Map<string, { card: CardInstance; lane: LocationIndex }>,
  silencedLanes: Set<LocationIndex>,
): void {
  const def = getCardDef(source.defId);
  if (!def.ability || def.ability.kind !== 'ongoing') return;
  if (LANE_BONUS_ONGOING.has(def.ability.id)) return;
  const isSilencer = def.ability.id === 'ongoing-silence-lane';
  if (!isSilencer) {
    if (source.silenced) return;
    if (silencedLanes.has(lane)) return;
  }
  if (MULTIPLY_ONGOING.has(def.ability.id)) {
    const handler = ONGOING[def.ability.id];
    if (!handler) return;
    const partial = handler(state, source, lane);
    for (const [uid, mult] of Object.entries(partial)) {
      multipliers[uid] = Math.max(multipliers[uid] ?? 1, mult);
    }
    return;
  }
  const handler = ONGOING[def.ability.id];
  if (!handler) return;
  const partial = handler(state, source, lane);
  for (const [uid, delta] of Object.entries(partial)) {
    if (delta < 0) {
      const info = uidIndex.get(uid);
      if (info && isPowerDecreaseImmune(state, info.card, info.lane)) {
        continue;
      }
    }
    modifiers[uid] = (modifiers[uid] ?? 0) + delta;
  }
}

/**
 * Sanctuaire — les cartes sur ce lieu émettent leurs effets continus une 2e fois
 * (ex. Athéna +1 → +2 partout ; Saga ×2 → ×4 sur les alliés visés).
 */
function applySanctuaryDoubleOngoing(
  state: GameState,
  silencedLanes: Set<LocationIndex>,
  modifiers: Record<string, number>,
  multipliers: Record<string, number>,
  laneBonuses: Array<Record<PlayerId, number>>,
  uidIndex: Map<string, { card: CardInstance; lane: LocationIndex }>,
): void {
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (!isSanctuaryLane(state, l, silencedLanes)) continue;
    const all = [...state.lanes[l].cards.player, ...state.lanes[l].cards.ai];
    for (const c of all) {
      const def = getCardDef(c.defId);
      if (!def.ability || def.ability.kind !== 'ongoing') continue;
      if (LANE_BONUS_ONGOING.has(def.ability.id)) {
        applyLaneOngoingFromSource(state, c, l, laneBonuses, silencedLanes);
        continue;
      }
      const isSilencer = def.ability.id === 'ongoing-silence-lane';
      if (!isSilencer) {
        if (c.silenced) continue;
        if (silencedLanes.has(l)) continue;
      }
      if (MULTIPLY_ONGOING.has(def.ability.id)) {
        const handler = ONGOING[def.ability.id];
        if (!handler) continue;
        const partial = handler(state, c, l);
        for (const [uid, mult] of Object.entries(partial)) {
          const current = multipliers[uid] ?? 1;
          multipliers[uid] = current * mult;
        }
        continue;
      }
      applyOngoingFromSource(
        state,
        c,
        l,
        modifiers,
        multipliers,
        uidIndex,
        silencedLanes,
      );
    }
  }
}

export function computeOngoing(state: GameState): OngoingResult {
  const modifiers: Record<string, number> = {};
  const multipliers: Record<string, number> = {};
  const laneBonuses = emptyLaneBonuses();
  const uidIndex = new Map<string, { card: CardInstance; lane: LocationIndex }>();
  for (const l of [0, 1, 2] as LocationIndex[]) {
    for (const c of [...state.lanes[l].cards.player, ...state.lanes[l].cards.ai]) {
      uidIndex.set(c.uid, { card: c, lane: l });
    }
  }
  // Pre-pass: which lanes are silenced (Camus ou Sibérie) ?
  const silencedLanes = new Set<LocationIndex>();
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (isSiberiaLocation(state, l)) {
      silencedLanes.add(l);
    }
  }
  for (const l of [0, 1, 2] as LocationIndex[]) {
    const lane = state.lanes[l];
    const all = [...lane.cards.player, ...lane.cards.ai];
    for (const c of all) {
      if (c.silenced) continue;
      const def = getCardDef(c.defId);
      if (def.ability?.id === 'ongoing-silence-lane') {
        silencedLanes.add(l);
        break;
      }
    }
  }
  for (const l of [0, 1, 2] as LocationIndex[]) {
    const all = [
      ...state.lanes[l].cards.player,
      ...state.lanes[l].cards.ai,
    ];
    for (const c of all) {
      applyOngoingFromSource(
        state,
        c,
        l,
        modifiers,
        multipliers,
        uidIndex,
        silencedLanes,
      );
      applyLaneOngoingFromSource(state, c, l, laneBonuses, silencedLanes);
    }
  }
  const locMods = applyLocationOngoingModifiers(state, silencedLanes);
  for (const [uid, delta] of Object.entries(locMods)) {
    if (delta < 0) {
      const info = uidIndex.get(uid);
      if (info && isPowerDecreaseImmune(state, info.card, info.lane)) {
        continue;
      }
    }
    modifiers[uid] = (modifiers[uid] ?? 0) + delta;
  }
  applySanctuaryDoubleOngoing(
    state,
    silencedLanes,
    modifiers,
    multipliers,
    laneBonuses,
    uidIndex,
  );
  applyWinningLaneBonuses(
    state,
    modifiers,
    multipliers,
    laneBonuses,
    silencedLanes,
  );
  return { modifiers, multipliers, laneBonuses };
}

/**
 * Nachi (+1 si on gagne ici) — calcule la puissance avec les autres continus
 * déjà résolus, puis ajoute le bonus (×2 au Sanctuaire).
 */
function applyWinningLaneBonuses(
  state: GameState,
  modifiers: Record<string, number>,
  multipliers: Record<string, number>,
  laneBonuses: Array<Record<PlayerId, number>>,
  silencedLanes: Set<LocationIndex>,
): void {
  const ongoing = { modifiers, multipliers, laneBonuses };
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (silencedLanes.has(l)) continue;
    const powers: Record<PlayerId, number> = { player: 0, ai: 0 };
    for (const side of ['player', 'ai'] as PlayerId[]) {
      for (const c of state.lanes[l].cards[side]) {
        powers[side] += scoringPower(state, c, ongoing);
      }
      powers[side] += laneBonuses[l]?.[side] ?? 0;
    }
    for (const side of ['player', 'ai'] as PlayerId[]) {
      if (powers[side] <= powers[otherPlayer(side)]) continue;
      for (const c of state.lanes[l].cards[side]) {
        if (c.silenced) continue;
        const def = getCardDef(c.defId);
        if (def.ability?.id !== 'ongoing-plus-if-winning-here') continue;
        let amount = 1;
        if (isSanctuaryLane(state, l, silencedLanes)) amount *= 2;
        modifiers[c.uid] = (modifiers[c.uid] ?? 0) + amount;
      }
    }
  }
}

/** True if `lane` currently has an active (non-silenced) lane silencer. */
export function isLaneSilenced(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isSiberiaLocation(state, lane)) return true;
  const all = [
    ...state.lanes[lane].cards.player,
    ...state.lanes[lane].cards.ai,
  ];
  return all.some((c) => {
    if (c.silenced) return false;
    const def = getCardDef(c.defId);
    return def.ability?.id === 'ongoing-silence-lane';
  });
}

/** True if `lane` disables on-reveal effects due to an active Algol. */
export function isOnRevealDisabled(state: GameState, lane: LocationIndex): boolean {
  if (isLaneSilenced(state, lane)) return false;
  const all = [
    ...state.lanes[lane].cards.player,
    ...state.lanes[lane].cards.ai,
  ];
  return all.some((c) => {
    if (c.silenced) return false;
    const def = getCardDef(c.defId);
    return def.ability?.id === 'ongoing-disable-onreveal-here';
  });
}

export function getHandDeckCostReduction(state: GameState, ownerId: PlayerId): number {
  const silencedLanes = new Set<LocationIndex>();
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (isLaneSilenced(state, l)) silencedLanes.add(l);
  }

  let total = 0;
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (silencedLanes.has(l)) continue;
    for (const c of state.lanes[l].cards[ownerId]) {
      if (c.silenced) continue;
      const def = getCardDef(c.defId);
      if (def.ability?.id !== 'ongoing-reduce-cost-hand-deck') continue;
      let amount = 1;
      if (isSanctuaryLane(state, l, silencedLanes)) amount *= 2;
      total += amount;
    }
  }
  return total;
}

/**
 * Surcoût imposé à la main de `victimId` par les effets continus adverses
 * (ex. Milo : +1 à toutes les cartes en main).
 */
export function getEnemyHandCostIncrease(
  state: GameState,
  victimId: PlayerId,
): number {
  const enemy = otherPlayer(victimId);
  const silencedLanes = new Set<LocationIndex>();
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (isLaneSilenced(state, l)) silencedLanes.add(l);
  }

  let total = 0;
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (silencedLanes.has(l)) continue;
    for (const c of state.lanes[l].cards[enemy]) {
      if (c.silenced) continue;
      const def = getCardDef(c.defId);
      if (def.ability?.id !== 'ongoing-increase-enemy-hand-cost') continue;
      let amount = (def.ability.params?.amount as number) ?? 1;
      if (isSanctuaryLane(state, l, silencedLanes)) amount *= 2;
      total += amount;
    }
  }
  return total;
}

/** Coût effectif pour jouer une carte depuis la main. */
export function getEffectiveHandCost(
  state: GameState,
  ownerId: PlayerId,
  baseCost: number,
  costDelta = 0,
): number {
  const reduction = getHandDeckCostReduction(state, ownerId);
  const increase = getEnemyHandCostIncrease(state, ownerId);
  return Math.max(0, baseCost + costDelta - reduction + increase);
}

/** Coût jouable d'une instance (inclut costDelta + réductions + taxes). */
export function getEffectiveCost(
  card: CardInstance,
  state: GameState,
  ownerId: PlayerId = card.ownerId,
): number {
  const def = getCardDef(card.defId);
  return getEffectiveHandCost(state, ownerId, def.cost, card.costDelta ?? 0);
}

// ---------------------------------------------------------------------------
// Tick handlers — run once per reveal phase, after every on-reveal resolves.
// ---------------------------------------------------------------------------

type TickHandler = (
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
) => GameState;

const TICK: Record<string, TickHandler> = {
  /** Milo — −1 PERMANENT to 2 random distinct enemies in this lane. */
  'tick-debuff-2-random-here': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    // Pick up to 2 distinct random targets.
    const pool = enemies.slice();
    const picks: CardInstance[] = [];
    for (let i = 0; i < 2 && pool.length > 0; i += 1) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    let next = state;
    for (const target of picks) {
      next = adjustLanePower(
        next,
        lane,
        enemy,
        -1,
        (c) => c.uid === target.uid,
      );
    }
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${getCardDef(source.defId).name} pique ${
            picks.length
          } ennemi(s) ici.`,
        },
      ],
    };
  },

  /** Ichi — −1 PERMANENT to 1 random enemy in this lane. */
  'tick-debuff-1-random-here': (state, source, lane) => {
    const enemy = otherPlayer(source.ownerId);
    const enemies = state.lanes[lane].cards[enemy];
    if (enemies.length === 0) return state;
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const next = adjustLanePower(
      state,
      lane,
      enemy,
      -1,
      (c) => c.uid === target.uid,
    );
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${getCardDef(source.defId).name} empoisonne ${getCardDef(
            target.defId,
          ).name}.`,
        },
      ],
    };
  },

  /** June — +N permanent to self (N = unused allied cosmos this turn). */
  'tick-june-cosmos-stack': (state, source, lane) => {
    const unused = state.players[source.ownerId].cosmos;
    if (unused <= 0) return state;
    const next = adjustLanePower(
      state,
      lane,
      source.ownerId,
      unused,
      (c) => c.uid === source.uid,
    );
    const name = getCardDef(source.defId).name;
    return {
      ...next,
      log: [
        ...next.log,
        {
          turn: next.turn,
          text: `${name} cumule +${unused} pwr (${unused} Cosmos non utilisé${
            unused > 1 ? 's' : ''
          }).`,
        },
      ],
    };
  },

  /** Self growth — +1 permanent to self. */
  'tick-buff-self-1': (state, source, lane) => {
    const next = adjustLanePower(
      state,
      lane,
      source.ownerId,
      1,
      (c) => c.uid === source.uid,
    );
    return {
      ...next,
      log: [
        ...next.log,
        { turn: next.turn, text: `${getCardDef(source.defId).name} renforce son cosmos (+1).` },
      ],
    };
  },

  /** Dragon Noir — summons a no-effect double once (then stops). */
  'tick-summon-double-once': (state, source, lane) => {
    if (source.abilityUsed) return state;
    if (!canAddRevealedToSide(state, lane, source.ownerId)) return state;
    const marked = updateCardInLane(state, lane, source.ownerId, source.uid, {
      ...source,
      abilityUsed: true,
    });
    const tokenDef = getCardDef('black-dragon-double');
    const token: CardInstance = {
      uid: `t${Math.random().toString(16).slice(2)}`,
      defId: 'black-dragon-double',
      ownerId: source.ownerId,
      basePower: tokenDef.power,
      revealed: true,
      playedTurn: state.turn,
    };
    const next = appendRevealedToSide(marked, lane, source.ownerId, token);
    return {
      ...next,
      log: [
        ...next.log,
        { turn: next.turn, text: 'Dragon Noir invoque un double.' },
      ],
    };
  },
};

/**
 * Run all registered tick handlers for ongoing cards currently in play.
 * Called from the engine at the end of `revealPhase`.
 */
export function applyTicks(state: GameState): GameState {
  let s = state;
  // Misty is retroactive: if active, remove any existing permanent decreases on
  // allied cards (basePower below printed power). This runs after reveals, so it
  // also cancels debuffs applied later in the same reveal phase.
  s = applyMistyRetroactive(s, 'player');
  s = applyMistyRetroactive(s, 'ai');
  for (const l of [0, 1, 2] as LocationIndex[]) {
    const lane = s.lanes[l];
    const all = [...lane.cards.player, ...lane.cards.ai];
    for (const c of all) {
      if (c.silenced) continue;
      // Camus mutes other ongoing effects in this lane, including ticks.
      if (isLaneSilenced(s, l)) {
        const cdef0 = getCardDef(c.defId);
        if (cdef0.ability?.id !== 'ongoing-silence-lane') continue;
      }
      const def = getCardDef(c.defId);
      if (def.ability?.kind !== 'ongoing') continue;
      const tickId = def.ability?.params?.tick as string | undefined;
      if (!tickId) continue;
      const handler = TICK[tickId];
      if (!handler) continue;
      // Snapshot the current location of the card (lane membership might have
      // shifted due to previous ticks).
      const stillThere = s.lanes[l].cards[c.ownerId].some(
        (x) => x.uid === c.uid,
      );
      if (!stillThere) continue;
      s = handler(s, c, l);
    }
  }
  return s;
}

function applyMistyRetroactive(state: GameState, ownerId: PlayerId): GameState {
  if (!hasActiveMisty(state, ownerId)) return state;
  const newLanes = state.lanes.map((lane) => ({
    cards: { player: lane.cards.player.slice(), ai: lane.cards.ai.slice() },
  }));
  let changed = false;
  for (const l of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      if (side !== ownerId) continue;
      newLanes[l].cards[side] = newLanes[l].cards[side].map((c) => {
        const def = getCardDef(c.defId);
        if (c.basePower < def.power) {
          changed = true;
          return { ...c, basePower: def.power };
        }
        return c;
      });
    }
  }
  if (!changed) return state;
  return {
    ...state,
    lanes: newLanes as unknown as GameState['lanes'],
    log: [
      ...state.log,
      { turn: state.turn, text: 'Misty dissipe les malédictions de puissance.' },
    ],
  };
}

function hasActiveMisty(state: GameState, ownerId: PlayerId): boolean {
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (isLaneSilenced(state, l)) continue;
    for (const c of state.lanes[l].cards[ownerId]) {
      if (c.silenced) continue;
      const def = getCardDef(c.defId);
      if (def.ability?.id === 'ongoing-no-decrease-allies') return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function otherPlayer(id: PlayerId): PlayerId {
  return id === 'player' ? 'ai' : 'player';
}

export interface ShuraRevealResolve {
  /** État après placement de la carte tirée (avant son au révélé). */
  afterPlace: GameState;
  /** État après l'effet au révélé de la carte tirée. */
  afterEffect: GameState;
  /** État final après destruction conditionnelle. */
  final: GameState;
  placedUid: string | null;
  destroyedUid: string | null;
  /** Index de slot au moment du placement (vol d'invocation). */
  summonSlotIndex: number;
  /** Côté où la carte est invoquée (deck adverse). */
  summonSide: PlayerId;
  /** Index de slot au moment de la destruction (peut différer si l'effet déplace). */
  slotIndex: number;
  /** Côté où la carte se trouve pour la destruction. */
  enemySide: PlayerId;
  placedDefId: string | null;
}

const GALACTIC_TOURNAMENT_ID = 'loc-galactic-tournament-double-on-reveal';

function findCardOnLane(
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

function applyPulledCardOnReveal(
  state: GameState,
  lane: LocationIndex,
  uid: string,
): GameState {
  if (isOnRevealDisabled(state, lane)) {
    const found = findCardOnLane(state, lane, uid);
    if (found && getCardDef(found.card.defId).ability?.kind === 'on-reveal') {
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

  let s = state;
  const first = findCardOnLane(s, lane, uid);
  if (!first) return s;
  if (getCardDef(first.card.defId).ability?.kind !== 'on-reveal') return s;

  const runPass = () => {
    const found = findCardOnLane(s, lane, uid);
    if (!found) return;
    s = applyOnReveal(s, found.card, lane);
  };

  runPass();

  if (s.locations[lane]?.effect?.id === GALACTIC_TOURNAMENT_ID) {
    const still = findCardOnLane(s, lane, uid);
    if (still && getCardDef(still.card.defId).ability?.kind === 'on-reveal') {
      runPass();
      const def = getCardDef(first.card.defId);
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

/**
 * Shura — tire une carte du deck adverse, la place de son côté ici,
 * laisse jouer son effet Au révélé, puis la détruit seulement si sa
 * puissance (après effet) est inférieure à celle de Shura et qu'elle
 * n'est pas protégée / indestructible.
 */
export function resolveShuraRevealThenDestroy(
  state: GameState,
  source: CardInstance,
  lane: LocationIndex,
): ShuraRevealResolve {
  const enemy = otherPlayer(source.ownerId);
  const empty: ShuraRevealResolve = {
    afterPlace: state,
    afterEffect: state,
    final: state,
    placedUid: null,
    destroyedUid: null,
    summonSlotIndex: -1,
    summonSide: enemy,
    slotIndex: -1,
    enemySide: enemy,
    placedDefId: null,
  };

  const enemyPlayer = state.players[enemy];
  if (enemyPlayer.deck.length === 0) return empty;

  const [drawn, ...restDeck] = enemyPlayer.deck;
  const name = getCardDef(source.defId).name;
  const drawnDef = getCardDef(drawn.defId);

  if (!canAddRevealedToSide(state, lane, enemy)) {
    const blocked: GameState = {
      ...state,
      log: [
        ...state.log,
        {
          turn: state.turn,
          text: `${name} : le côté adverse est plein, impossible d'ajouter une carte.`,
        },
      ],
    };
    return {
      ...empty,
      afterPlace: blocked,
      afterEffect: blocked,
      final: blocked,
    };
  }

  const placed: CardInstance = {
    ...drawn,
    revealed: true,
    // Invocation — pas jouée par le propriétaire (ex. Île d'Andromède ne déplace pas).
    playedTurn: undefined,
    playedLane: undefined,
    silenced: false,
  };

  let afterPlace: GameState = {
    ...state,
    players: {
      ...state.players,
      [enemy]: { ...enemyPlayer, deck: restDeck },
    },
  };
  afterPlace = appendRevealedToSide(afterPlace, lane, enemy, placed);

  const slotIndex = afterPlace.lanes[lane].cards[enemy].findIndex(
    (c) => c.uid === placed.uid,
  );
  const summonSlotIndex = slotIndex;
  const summonSide = enemy;

  afterPlace = {
    ...afterPlace,
    log: [
      ...afterPlace.log,
      {
        turn: state.turn,
        text: `${name} invoque ${drawnDef.name} du deck adverse ici.`,
      },
    ],
  };

  const afterEffect = applyPulledCardOnReveal(
    afterPlace,
    lane,
    placed.uid,
  );

  const located = findCardOnLane(afterEffect, lane, placed.uid);
  if (!located) {
    // La carte a quitté le lieu via son effet — pas de destruction.
    return {
      afterPlace,
      afterEffect,
      final: afterEffect,
      placedUid: placed.uid,
      destroyedUid: null,
      summonSlotIndex,
      summonSide,
      slotIndex,
      enemySide: enemy,
      placedDefId: placed.defId,
    };
  }

  const effectSlotIndex = afterEffect.lanes[lane].cards[located.side].findIndex(
    (c) => c.uid === placed.uid,
  );
  const vfxSlot = effectSlotIndex >= 0 ? effectSlotIndex : slotIndex;

  const shuraOnLane = findCardOnLane(afterEffect, lane, source.uid);
  const shuraCard = shuraOnLane?.card ?? source;
  const shuraPower = currentPower(afterEffect, shuraCard);
  const drawnPower = currentPower(afterEffect, located.card);

  if (!(drawnPower < shuraPower)) {
    return {
      afterPlace,
      afterEffect,
      final: afterEffect,
      placedUid: placed.uid,
      destroyedUid: null,
      summonSlotIndex,
      summonSide,
      slotIndex: vfxSlot,
      enemySide: located.side,
      placedDefId: placed.defId,
    };
  }

  if (isProtected(afterEffect, located.card, lane)) {
    const resisted: GameState = {
      ...afterEffect,
      log: [
        ...afterEffect.log,
        {
          turn: state.turn,
          text: `${drawnDef.name} résiste à ${name} !`,
        },
      ],
    };
    return {
      afterPlace,
      afterEffect: resisted,
      final: resisted,
      placedUid: placed.uid,
      destroyedUid: null,
      summonSlotIndex,
      summonSide,
      slotIndex: vfxSlot,
      enemySide: located.side,
      placedDefId: placed.defId,
    };
  }

  const result = destroyAtLane(
    afterEffect,
    lane,
    located.side,
    (c) => c.uid === placed.uid,
    source,
  );
  const destroyed = result.destroyed.some((c) => c.uid === placed.uid);
  const final: GameState = destroyed
    ? {
        ...result.state,
        log: [
          ...result.state.log,
          {
            turn: state.turn,
            text: `${drawnDef.name} (${drawnPower}) est inférieur à ${name} (${shuraPower}) — détruit !`,
          },
        ],
      }
    : result.state;

  return {
    afterPlace,
    afterEffect,
    final,
    placedUid: placed.uid,
    destroyedUid: destroyed ? placed.uid : null,
    summonSlotIndex,
    summonSide,
    slotIndex: vfxSlot,
    enemySide: located.side,
    placedDefId: placed.defId,
  };
}

/**
 * Current effective power of a card: basePower + ongoing modifiers.
 * Use this whenever a destruction handler needs to compare power against
 * what the player sees on screen.
 */
export function currentPower(state: GameState, card: CardInstance): number {
  return effectivePower(card, computeOngoing(state));
}

function isPowerDecreaseImmune(
  state: GameState,
  card: CardInstance,
  lane: LocationIndex,
): boolean {
  if (isLaneSilenced(state, lane)) return false;

  if (isJamirNoDecreaseLane(state, lane)) return true;

  // Self immunity (Geki, Aldébaran).
  {
    const def = getCardDef(card.defId);
    if (
      def.ability?.kind === 'ongoing' &&
      (def.ability.id === 'ongoing-no-decrease-self' ||
        def.ability.id === 'ongoing-immune')
    ) {
      if (card.silenced) return false;
      return true;
    }
  }

  // Aura immunity (Misty): if an unsilenced Misty exists for this owner in a
  // non-silenced lane, allied cards cannot be decreased.
  for (const l of [0, 1, 2] as LocationIndex[]) {
    if (isLaneSilenced(state, l)) continue;
    for (const c of state.lanes[l].cards[card.ownerId]) {
      if (c.silenced) continue;
      const def = getCardDef(c.defId);
      if (def.ability?.id === 'ongoing-no-decrease-allies') return true;
    }
  }
  return false;
}

function hasCardInPlay(state: GameState, ownerId: PlayerId, defId: string): boolean {
  for (const l of [0, 1, 2] as LocationIndex[]) {
    for (const c of state.lanes[l].cards[ownerId]) {
      if (c.defId === defId) return true;
    }
  }
  return false;
}

function addTokenToLane(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  defId: string,
  source?: CardInstance,
): GameState {
  if (!canFitAdditionalCardOnSide(state, lane, side)) return state;
  const def = getCardDef(defId);
  const token: CardInstance = {
    uid: `t${Math.random().toString(16).slice(2)}`,
    defId,
    ownerId: side,
    basePower: def.power,
    revealed: true,
    playedTurn: state.turn,
  };
  const next = appendRevealedToSide(state, lane, side, token);
  const sourceName = source ? getCardDef(source.defId).name : null;
  return {
    ...next,
    lanes: next.lanes,
    log: [
      ...state.log,
      {
        turn: state.turn,
        text: sourceName
          ? `${sourceName} invoque une Âme perdue.`
          : 'Une Âme perdue apparaît.',
      },
    ],
  };
}

function returnToHand(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  card: CardInstance,
): GameState {
  // Remove by uid (don't assume `card` reference matches lane instance).
  const existing = state.lanes[lane].cards[side].find((c) => c.uid === card.uid);
  if (!existing) return state;
  if (isIndestructible(state, existing, lane)) return state;
  const newLanes = state.lanes.map((l, i) => {
    if (i !== lane) return l;
    return {
      cards: {
        player:
          side === 'player'
            ? l.cards.player.filter((c) => c.uid !== card.uid)
            : l.cards.player,
        ai:
          side === 'ai' ? l.cards.ai.filter((c) => c.uid !== card.uid) : l.cards.ai,
      },
    };
  });
  const bounced: CardInstance = {
    ...existing,
    ...card, // keep mutated power / flags
    revealed: false,
    playedTurn: undefined,
    silenced: false,
  };
  return {
    ...state,
    lanes: newLanes,
    players: {
      ...state.players,
      [side]: { ...state.players[side], hand: [...state.players[side].hand, bounced] },
    },
  };
}

/** Mû (ou autre) avec `ongoing-protect-allies-here` actif sur ce lieu. */
function isLaneProtectedFromDestruction(
  state: GameState,
  lane: LocationIndex,
): boolean {
  if (isLaneSilenced(state, lane)) return false;
  const all = [
    ...state.lanes[lane].cards.player,
    ...state.lanes[lane].cards.ai,
  ];
  return all.some((c) => {
    if (c.silenced) return false;
    const adef = getCardDef(c.defId);
    return (
      adef.ability?.kind === 'ongoing' &&
      adef.ability.id === 'ongoing-protect-allies-here'
    );
  });
}

/**
 * Aldébaran et autres cartes `ongoing-immune` : indestructibles, ancrées,
 * et immunisées contre les diminutions de puissance (sauf silence).
 */
export function isIndestructible(
  state: GameState,
  card: CardInstance,
  lane: LocationIndex,
): boolean {
  const def = getCardDef(card.defId);
  if (def.ability?.kind !== 'ongoing' || def.ability.id !== 'ongoing-immune') {
    return false;
  }
  if (card.silenced) return false;
  if (isLaneSilenced(state, lane)) return false;
  return true;
}

/**
 * True if `card` cannot be destroyed at the moment.
 * - Self-immune: the card itself has `ongoing-immune` and is not silenced.
 * - Lane protection: an unsilenced protector on this lane has
 *   `ongoing-protect-allies-here` (covers every card here, allies and enemies).
 *   A silenced protector grants no protection.
 *
 * Note: a Camus-silenced lane disables protection ongoings as well, since
 * lane silencing gates *all* ongoing handlers (except the silencer itself).
 */
export function isProtected(
  state: GameState,
  card: CardInstance,
  lane: LocationIndex,
): boolean {
  if (isIndestructible(state, card, lane)) return true;
  return isLaneProtectedFromDestruction(state, lane);
}

export const SHIRYU_DEATH_ABILITY_ID = 'shiryu-death-buff-allies';
export const BLACK_DRAGON_DEATH_ABILITY_ID =
  'black-dragon-death-summon-double';
export const IKKI_DEATH_ABILITY_ID = 'ikki-death-double-bounce';

/** +N permanent à chaque carte alliée en jeu (même propriétaire, hors ennemis). */
function buffAlliesInPlay(
  state: GameState,
  ownerId: PlayerId,
  amount: number,
  excludeUid?: string,
): { state: GameState; hit: number } {
  let next = state;
  let hit = 0;
  const isAlly = (c: CardInstance) =>
    c.ownerId === ownerId && c.uid !== excludeUid;

  for (const l of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      const allies = next.lanes[l].cards[side].filter(isAlly);
      if (allies.length === 0) continue;
      hit += allies.length;
      next = adjustLanePower(next, l, side, amount, isAlly);
    }
  }

  return { state: next, hit };
}

function applyDestroyedCardEffects(
  state: GameState,
  destroyed: CardInstance[],
  lane: LocationIndex,
): GameState {
  let next = state;
  for (const card of destroyed) {
    const def = getCardDef(card.defId);
    if (def.ability?.kind !== 'on-destroy') continue;

    if (def.ability.id === SHIRYU_DEATH_ABILITY_ID) {
      const amount = (def.ability?.params?.amount as number) ?? 1;
      const ownerId = card.ownerId;
      const { state: buffed, hit } = buffAlliesInPlay(
        next,
        ownerId,
        amount,
        card.uid,
      );
      next = buffed;

      next = {
        ...next,
        log: [
          ...next.log,
          {
            turn: next.turn,
            text:
              hit > 0
                ? `${def.name} s'élève en comète : +${amount} à ${hit} carte(s) alliée(s).`
                : `${def.name} s'élève en comète.`,
          },
        ],
      };
      continue;
    }

    if (def.ability.id === BLACK_DRAGON_DEATH_ABILITY_ID) {
      if (!canAddRevealedToSide(next, lane, card.ownerId)) continue;
      const tokenId =
        (def.ability.params?.tokenId as string) ?? 'black-dragon-double';
      const tokenDef = getCardDef(tokenId);
      const token: CardInstance = {
        uid: `t${Math.random().toString(16).slice(2)}`,
        defId: tokenId,
        ownerId: card.ownerId,
        basePower: tokenDef.power,
        revealed: true,
        playedTurn: next.turn,
      };
      next = appendRevealedToSide(next, lane, card.ownerId, token);
      next = {
        ...next,
        log: [
          ...next.log,
          {
            turn: next.turn,
            text: `${def.name} laisse son double sur le lieu.`,
          },
        ],
      };
      continue;
    }

    if (def.ability.id === IKKI_DEATH_ABILITY_ID) {
      const ownerId = card.ownerId;
      const doubled = Math.max(0, card.basePower) * 2;
      const reborn: CardInstance = {
        ...card,
        basePower: doubled,
        revealed: false,
        playedTurn: undefined,
        playedLane: undefined,
        silenced: false,
      };
      next = {
        ...next,
        graveyard: {
          ...next.graveyard,
          [ownerId]: next.graveyard[ownerId].filter((c) => c.uid !== card.uid),
        },
        players: {
          ...next.players,
          [ownerId]: {
            ...next.players[ownerId],
            hand: [...next.players[ownerId].hand, reborn],
          },
        },
        log: [
          ...next.log,
          {
            turn: next.turn,
            text: `${def.name} renaît de ses cendres (${doubled} pwr) et retourne en main.`,
          },
        ],
      };
    }
  }
  return next;
}

/** Somme des puissances effectives des cartes détruites (état avant retrait). */
function sumDestroyedCardsPower(
  state: GameState,
  destroyed: CardInstance[],
): number {
  if (destroyed.length === 0) return 0;
  const ongoing = computeOngoing(state);
  return destroyed.reduce(
    (sum, card) => sum + effectivePower(card, ongoing),
    0,
  );
}

/** Remove from a lane every card on `side` matching `predicate`. */
export function destroyAtLane(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  predicate: (c: CardInstance) => boolean,
  source?: CardInstance,
): { state: GameState; destroyed: CardInstance[] } {
  const target = state.lanes[lane].cards[side];
  const candidates = target.filter(predicate);
  if (candidates.length === 0) return { state, destroyed: [] };
  const destroyed: CardInstance[] = [];
  const protectedFromDestruction: CardInstance[] = [];
  for (const c of candidates) {
    if (isProtected(state, c, lane)) protectedFromDestruction.push(c);
    else destroyed.push(c);
  }
  const destroyedSet = new Set(destroyed.map((c) => c.uid));
  const remaining = target.filter((c) => !destroyedSet.has(c.uid));
  const newLanes = state.lanes.map((l, i) => {
    if (i !== lane) return l;
    return {
      cards: {
        player: side === 'player' ? remaining : l.cards.player,
        ai: side === 'ai' ? remaining : l.cards.ai,
      },
    };
  });
  const sourceName = source ? getCardDef(source.defId).name : null;
  const destroyLogs = destroyed.map((c) => {
    const victim = getCardDef(c.defId).name;
    return {
      turn: state.turn,
      text: sourceName
        ? `${sourceName} terrasse ${victim} !`
        : `${victim} est terrass\u00e9.`,
    };
  });
  const protectLogs = protectedFromDestruction.map((c) => {
    const protectedName = getCardDef(c.defId).name;
    return {
      turn: state.turn,
      text: sourceName
        ? `${protectedName} r\u00e9siste \u00e0 ${sourceName} !`
        : `${protectedName} r\u00e9siste.`,
    };
  });
  // Push destroyed cards into the global graveyard (per-side bucket).
  const newGraveyard = {
    ...state.graveyard,
    [side]: [...state.graveyard[side], ...destroyed],
  };
  const baseState = {
    ...state,
    lanes: newLanes,
    graveyard: newGraveyard,
    totalDestroyed: (state.totalDestroyed ?? 0) + destroyed.length,
    totalDestroyedPower:
      (state.totalDestroyedPower ?? 0) + sumDestroyedCardsPower(state, destroyed),
    log: [...state.log, ...destroyLogs, ...protectLogs],
  };
  return {
    state: applyDestroyedCardEffects(baseState, destroyed, lane),
    destroyed,
  };
}

/**
 * Same as destroyAtLane, but ignores lane protection (ex. Mu).
 * Les cartes indestructibles (`ongoing-immune`) résistent quand même.
 */
export function destroyAtLaneForced(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  predicate: (c: CardInstance) => boolean,
  source?: CardInstance,
): { state: GameState; destroyed: CardInstance[] } {
  const target = state.lanes[lane].cards[side];
  const candidates = target.filter(predicate);
  if (candidates.length === 0) return { state, destroyed: [] };
  const destroyed: CardInstance[] = [];
  const protectedFromDestruction: CardInstance[] = [];
  for (const c of candidates) {
    if (isIndestructible(state, c, lane)) protectedFromDestruction.push(c);
    else destroyed.push(c);
  }
  if (destroyed.length === 0 && protectedFromDestruction.length === 0) {
    return { state, destroyed: [] };
  }
  const destroyedSet = new Set(destroyed.map((c) => c.uid));
  const remaining = target.filter((c) => !destroyedSet.has(c.uid));
  const newLanes = state.lanes.map((l, i) => {
    if (i !== lane) return l;
    return {
      cards: {
        player: side === 'player' ? remaining : l.cards.player,
        ai: side === 'ai' ? remaining : l.cards.ai,
      },
    };
  });
  const sourceName = source ? getCardDef(source.defId).name : null;
  const destroyLogs = destroyed.map((c) => {
    const victim = getCardDef(c.defId).name;
    return {
      turn: state.turn,
      text: sourceName ? `${sourceName} tranche ${victim} !` : `${victim} est tranché.`,
    };
  });
  const protectLogs = protectedFromDestruction.map((c) => {
    const protectedName = getCardDef(c.defId).name;
    return {
      turn: state.turn,
      text: sourceName
        ? `${protectedName} r\u00e9siste \u00e0 ${sourceName} !`
        : `${protectedName} r\u00e9siste.`,
    };
  });
  const newGraveyard = {
    ...state.graveyard,
    [side]: [...state.graveyard[side], ...destroyed],
  };
  const baseState = {
    ...state,
    lanes: newLanes,
    graveyard: newGraveyard,
    totalDestroyed: (state.totalDestroyed ?? 0) + destroyed.length,
    totalDestroyedPower:
      (state.totalDestroyedPower ?? 0) + sumDestroyedCardsPower(state, destroyed),
    log: [...state.log, ...destroyLogs, ...protectLogs],
  };
  return {
    state: applyDestroyedCardEffects(baseState, destroyed, lane),
    destroyed,
  };
}

export function adjustLanePower(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  delta: number,
  predicate?: (c: CardInstance) => boolean,
): GameState {
  const newLanes = state.lanes.map((l, i) => {
    if (i !== lane) return l;
    return {
      cards: {
        player:
          side === 'player'
            ? l.cards.player.map((c) =>
                !predicate || predicate(c)
                  ? delta < 0 && isPowerDecreaseImmune(state, c, lane)
                    ? c
                    : { ...c, basePower: c.basePower + delta }
                  : c,
              )
            : l.cards.player,
        ai:
          side === 'ai'
            ? l.cards.ai.map((c) =>
                !predicate || predicate(c)
                  ? delta < 0 && isPowerDecreaseImmune(state, c, lane)
                    ? c
                    : { ...c, basePower: c.basePower + delta }
                  : c,
              )
            : l.cards.ai,
      },
    };
  });
  return { ...state, lanes: newLanes };
}

/**
 * Bounce a card from any lane back to the bottom of its owner's deck.
 * Preserves per-instance flags by pushing the full instance —
 * a fresh instantiation would reset them.
 */
export function returnToDeck(
  state: GameState,
  side: PlayerId,
  card: CardInstance,
): GameState {
  for (const lane of [0, 1, 2] as LocationIndex[]) {
    const onLane = state.lanes[lane].cards[side].find((c) => c.uid === card.uid);
    if (onLane && isIndestructible(state, onLane, lane)) return state;
  }
  const newLanes = state.lanes.map((l) => ({
    cards: {
      player:
        side === 'player'
          ? l.cards.player.filter((c) => c.uid !== card.uid)
          : l.cards.player,
      ai:
        side === 'ai'
          ? l.cards.ai.filter((c) => c.uid !== card.uid)
          : l.cards.ai,
    },
  }));
  const owner = state.players[side];
  return {
    ...state,
    lanes: newLanes,
    players: {
      ...state.players,
      [side]: {
        ...owner,
        deck: [
          ...owner.deck,
          { ...card, revealed: false, playedTurn: undefined },
        ],
      },
    },
  };
}

function removeRevealedFromSide(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  uid: string,
): GameState {
  const newLanes = state.lanes.map((l, i) => {
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
  });
  return { ...state, lanes: newLanes };
}

/** Replace a card in a given lane/side with a mutated copy. */
function updateCardInLane(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  uid: string,
  next: CardInstance,
): GameState {
  const newLanes = state.lanes.map((l, i) => {
    if (i !== lane) return l;
    return {
      cards: {
        player:
          side === 'player'
            ? l.cards.player.map((c) => (c.uid === uid ? next : c))
            : l.cards.player,
        ai:
          side === 'ai'
            ? l.cards.ai.map((c) => (c.uid === uid ? next : c))
            : l.cards.ai,
      },
    };
  });
  return { ...state, lanes: newLanes };
}
