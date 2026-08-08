import { getCardDef } from './cards';
import { getEffectiveCost } from './abilities';
import { canPlay, playCard, scoreSnapshot } from './engine';
import { locationPlayBonus } from './locationEffects';
import { countOccupiedOnSide } from './laneRules';
import { type GameState, type LocationIndex, LANE_CAPACITY } from './types';

/**
 * Greedy AI:
 * 1. Sort hand by descending cost (high impact first).
 * 2. For each playable card, pick the lane that maximizes a heuristic:
 *    - Prefer lanes where AI is currently behind/close.
 *    - Avoid placing in already-full lanes.
 *    - Mild preference for placing in a lane where the AI already has cards
 *      (synergy with abilities like ongoing-buff-allies-here).
 * 3. Repeat until no more cards can be played this turn.
 */
export function aiTakeTurn(state: GameState): GameState {
  let s = state;
  // Safety bound to avoid any pathological loop.
  for (let i = 0; i < 8; i += 1) {
    const ai = s.players.ai;
    const candidates = ai.hand
      .filter(
        (c) =>
          getEffectiveCost(c, s, 'ai') <= ai.cosmos,
      )
      .sort((a, b) => {
        const ca = getEffectiveCost(a, s, 'ai');
        const cb = getEffectiveCost(b, s, 'ai');
        return (
          cb - ca || getCardDef(b.defId).power - getCardDef(a.defId).power
        );
      });
    if (candidates.length === 0) break;

    let bestPlay: { uid: string; lane: LocationIndex; score: number } | null =
      null;

    for (const card of candidates) {
      for (const lane of [0, 1, 2] as LocationIndex[]) {
        const check = canPlay(s, 'ai', card.uid, lane);
        if (!check.ok) continue;
        const score =
          evaluate(s, lane) + locationPlayBonus(s, lane, card.defId);
        if (!bestPlay || score > bestPlay.score) {
          bestPlay = { uid: card.uid, lane, score };
        }
      }
    }

    if (!bestPlay) break;
    s = playCard(s, 'ai', bestPlay.uid, bestPlay.lane);
  }
  return s;
}

function evaluate(state: GameState, lane: LocationIndex): number {
  const snap = scoreSnapshot(state);
  const ai = snap.lanePower[lane].ai;
  const player = snap.lanePower[lane].player;
  const diff = player - ai; // bigger diff = more urgent
  const aiInLane = countOccupiedOnSide(state, lane, 'ai');
  // Penalize nearly-full lanes.
  const fullPenalty = aiInLane >= LANE_CAPACITY ? -1000 : 0;
  // Slight bonus for stacking allies (synergy).
  const stack = aiInLane * 0.4;
  return diff + stack + fullPenalty;
}
