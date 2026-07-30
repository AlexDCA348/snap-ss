import {
  ANDROMEDA_ISLAND_EFFECT_ID,
  applyLocationOnCardRevealed,
  resolveAndromedaRevealThenRelocate,
  resolveRevealedCardOnLane,
} from './locationEffects';
import { resolveShuraRevealThenDestroy } from './abilities';
import { getRevealOrder } from './engine';
import { appendRevealedToSide } from './laneRules';
import type { CardInstance, GameState, LocationIndex, PlayerId } from './types';
import { SHURA_DEF_ID } from './shuraBlade';

export interface RevealVfxStep {
  pending: CardInstance;
  revealed: CardInstance;
  side: PlayerId;
  lane: LocationIndex;
  /** État juste avant l'effet au révélé de cette carte. */
  stateBeforeEffect: GameState;
}

export function slotIndexForCard(
  state: GameState,
  lane: LocationIndex,
  side: PlayerId,
  uid: string,
): number {
  const revealed = state.lanes[lane].cards[side];
  const pending = state.players[side].pending[lane];
  const occupied = [...revealed, ...pending];
  return occupied.findIndex((c) => c.uid === uid);
}

/** Une image de la révélation progressive : état à afficher après cette étape. */
export interface RevealFrame {
  /** État du plateau après ce révélé (effet au révélé appliqué). */
  state: GameState;
  side: PlayerId;
  lane: LocationIndex;
  /** uid de la carte qui vient d'être révélée. */
  uid: string;
  /** Carte sur l'Île d'Andromède après au révélé, avant le déplacement. */
  andromedaRelocatePreview?: boolean;
  /** Shura : invocation en vol (carte tirée encore masquée sur le lieu). */
  shuraSummonPreview?: boolean;
  /** Shura : carte adverse placée, destruction Excalibur à venir. */
  shuraDestroyPreview?: boolean;
}

function laneForCard(
  state: GameState,
  uid: string,
): { lane: LocationIndex; side: PlayerId } | null {
  for (const lane of [0, 1, 2] as LocationIndex[]) {
    for (const side of ['player', 'ai'] as PlayerId[]) {
      if (state.lanes[lane].cards[side].some((c) => c.uid === uid)) {
        return { lane, side };
      }
    }
  }
  return null;
}

function withoutPending(
  state: GameState,
  side: PlayerId,
  lane: LocationIndex,
  uid: string,
): GameState {
  const player = state.players[side];
  const pending = { ...player.pending };
  pending[lane] = pending[lane].filter((c) => c.uid !== uid);
  return {
    ...state,
    players: {
      ...state.players,
      [side]: { ...player, pending },
    },
  };
}

/**
 * Carte retournée au révélé : encore sur le lieu, en main (Phénix…)
 * ou au cimetière (détruite par l'effet). Jamian : fin de révélation.
 */
function resolveRevealedInstance(
  postReveal: GameState,
  pid: PlayerId,
  lane: LocationIndex,
  pending: CardInstance,
): CardInstance | null {
  const stillPending = postReveal.players[pid].pending[lane].some(
    (c) => c.uid === pending.uid,
  );
  if (stillPending) return null;

  return (
    postReveal.lanes[lane].cards.player.find((c) => c.uid === pending.uid) ??
    postReveal.lanes[lane].cards.ai.find((c) => c.uid === pending.uid) ??
    postReveal.lanes
      .flatMap((l) => [...l.cards.player, ...l.cards.ai])
      .find((c) => c.uid === pending.uid) ??
    postReveal.players[pid].hand.find((c) => c.uid === pending.uid) ??
    postReveal.graveyard[pid].find((c) => c.uid === pending.uid) ??
    { ...pending, revealed: true }
  );
}

/**
 * Construit la chronologie de la révélation carte par carte, dans l'ordre
 * officiel (`getRevealOrder`). Chaque image contient l'état du plateau après
 * qu'une carte de plus a été retournée et son effet appliqué. La carte révélée
 * est retirée de la pile « en attente » pour éviter tout doublon à l'affichage.
 */
export function buildRevealTimeline(
  preReveal: GameState,
  postReveal: GameState,
): RevealFrame[] {
  const frames: RevealFrame[] = [];
  let s: GameState = { ...preReveal, phase: 'reveal' };

  for (const pid of getRevealOrder(preReveal)) {
    for (const lane of [0, 1, 2] as LocationIndex[]) {
      for (const pending of preReveal.players[pid].pending[lane]) {
        const revealed = resolveRevealedInstance(postReveal, pid, lane, pending);
        if (!revealed) continue;

        const flipped: CardInstance = { ...pending, revealed: true };
        let stateBeforeEffect = appendRevealedToSide(s, lane, pid, flipped);
        stateBeforeEffect = withoutPending(stateBeforeEffect, pid, lane, pending.uid);

        const isAndromeda =
          stateBeforeEffect.locations[lane]?.effect?.id ===
          ANDROMEDA_ISLAND_EFFECT_ID;

        // Shura avant Andromède : la carte invoquée reste sur l'île ;
        // seul Shura est ensuite déplacé par l'effet de lieu.
        if (pending.defId === SHURA_DEF_ID) {
          const onLane = stateBeforeEffect.lanes[lane].cards[pid].find(
            (c) => c.uid === pending.uid,
          );
          if (!onLane) {
            s = resolveRevealedCardOnLane(
              stateBeforeEffect,
              lane,
              pending.uid,
              pid,
            );
            frames.push({
              state: s,
              side: pid,
              lane,
              uid: pending.uid,
            });
            continue;
          }

          const { afterPlace, afterEffect, final, destroyedUid, placedUid } =
            resolveShuraRevealThenDestroy(stateBeforeEffect, onLane, lane);

          // 1) Shura se révèle.
          frames.push({
            state: stateBeforeEffect,
            side: pid,
            lane,
            uid: pending.uid,
          });

          if (placedUid) {
            // 2) La carte adverse vole depuis la main / deck vers le lieu.
            frames.push({
              state: afterPlace,
              side: pid,
              lane,
              uid: pending.uid,
              shuraSummonPreview: true,
            });

            // 3) La carte invoquée se révèle et joue son effet.
            frames.push({
              state: afterEffect,
              side: pid,
              lane,
              uid: pending.uid,
            });

            if (destroyedUid) {
              // 4) Excalibur (carte encore visible).
              frames.push({
                state: afterEffect,
                side: pid,
                lane,
                uid: pending.uid,
                shuraDestroyPreview: true,
              });
              // 5) Destruction résolue.
              frames.push({
                state: final,
                side: pid,
                lane,
                uid: pending.uid,
              });
            }
          } else {
            frames.push({
              state: final,
              side: pid,
              lane,
              uid: pending.uid,
            });
          }

          if (isAndromeda) {
            const relocated = applyLocationOnCardRevealed(
              final,
              lane,
              pid,
              pending.uid,
            );
            const willRelocate = relocated.lane !== lane;
            if (willRelocate) {
              frames.push({
                state: final,
                side: pid,
                lane,
                uid: pending.uid,
                andromedaRelocatePreview: true,
              });
              frames.push({
                state: relocated.state,
                side: pid,
                lane: relocated.lane,
                uid: pending.uid,
              });
            }
            s = relocated.state;
          } else {
            s = final;
          }
          continue;
        }

        if (isAndromeda) {
          const postPos = laneForCard(postReveal, pending.uid);
          const willRelocate = postPos !== null && postPos.lane !== lane;
          const { afterOnReveal, final } = resolveAndromedaRevealThenRelocate(
            stateBeforeEffect,
            lane,
            pending.uid,
            pid,
            willRelocate ? postPos.lane : undefined,
          );

          frames.push({
            state: stateBeforeEffect,
            side: pid,
            lane,
            uid: pending.uid,
          });

          frames.push({
            state: afterOnReveal,
            side: pid,
            lane,
            uid: pending.uid,
            andromedaRelocatePreview: willRelocate,
          });

          frames.push({
            state: final,
            side: postPos?.side ?? pid,
            lane: postPos?.lane ?? lane,
            uid: pending.uid,
          });

          s = final;
          continue;
        }

        s = resolveRevealedCardOnLane(stateBeforeEffect, lane, pending.uid, pid);

        frames.push({
          state: s,
          side: pid,
          lane,
          uid: pending.uid,
        });
      }
    }
  }

  return frames;
}

/** Rejoue l'ordre de révélé pour obtenir l'état avant chaque effet. */
export function enumerateRevealSteps(
  preReveal: GameState,
  postReveal: GameState,
): RevealVfxStep[] {
  const steps: RevealVfxStep[] = [];
  let s: GameState = { ...preReveal, phase: 'reveal' };

  for (const pid of getRevealOrder(preReveal)) {
    for (const lane of [0, 1, 2] as LocationIndex[]) {
      for (const pending of preReveal.players[pid].pending[lane]) {
        const revealed = resolveRevealedInstance(postReveal, pid, lane, pending);
        if (!revealed) continue;

        const flipped: CardInstance = { ...pending, revealed: true };
        const stateBeforeEffect = withoutPending(
          appendRevealedToSide(s, lane, pid, flipped),
          pid,
          lane,
          pending.uid,
        );

        const isAndromeda =
          stateBeforeEffect.locations[lane]?.effect?.id ===
          ANDROMEDA_ISLAND_EFFECT_ID;

        if (isAndromeda) {
          const postPos = laneForCard(postReveal, pending.uid);
          const willRelocate = postPos !== null && postPos.lane !== lane;
          const { final } = resolveAndromedaRevealThenRelocate(
            stateBeforeEffect,
            lane,
            pending.uid,
            pid,
            willRelocate ? postPos.lane : undefined,
          );
          steps.push({
            pending,
            revealed,
            side: pid,
            lane,
            stateBeforeEffect,
          });
          s = final;
          continue;
        }

        s = resolveRevealedCardOnLane(stateBeforeEffect, lane, pending.uid, pid);

        steps.push({
          pending,
          revealed,
          side: pid,
          lane,
          stateBeforeEffect,
        });
      }
    }
  }

  return steps;
}
