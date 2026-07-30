import { create } from 'zustand';
import {
  createInitialState,
  endTurn,
  playCard,
  revealPhaseUntilJamian,
  unplayCard,
} from '../game/engine';
import { aiTakeTurn } from '../game/ai';
import {
  collectIkkiRevealPhoenix,
  IKKI_PHOENIX_MS,
  type IkkiPhoenixBurst,
} from '../game/ikkiPhoenix';
import {
  collectJamianEndOfRevealCrows,
  JAMIAN_CROWS_MS,
  type JamianCrowBurst,
} from '../game/jamianCrows';
import {
  collectAiolosRevealArrows,
  AIOLOS_ARROW_MS,
  type AiolosArrowShot,
} from '../game/aiolosArrow';
import {
  collectBabelRevealFireballs,
  BABEL_FIREBALL_MS,
  type BabelFireballBurst,
} from '../game/babelFireball';
import {
  collectAioliaRevealPlasma,
  AIOLIA_PLASMA_MS,
  type AioliaPlasmaBurst,
} from '../game/aioliaPlasma';
import {
  collectMiloRevealImpacts,
  MILO_IMPACT_MS,
  type MiloImpactBurst,
} from '../game/miloImpact';
import {
  collectPtolemyRevealShots,
  PTOLEMY_ARROW_MS,
  type PtolemyArrowShot,
} from '../game/ptolemyArrow';
import {
  collectShiryuDeathBursts,
  SHIRYU_DRAGON_MS,
  type ShiryuDragonBurst,
} from '../game/shiryuDragon';
import {
  collectShuraRevealBlades,
  SHURA_BLADE_MS,
  type ShuraBladeBurst,
} from '../game/shuraBlade';
import {
  collectDeathmaskRevealSouls,
  DEATHMASK_SOULS_MS,
  type DeathmaskSoulBurst,
} from '../game/deathmaskSouls';
import {
  collectAldebaranRevealImpacts,
  ALDEBARAN_IMPACT_MS,
  type AldebaranImpactBurst,
} from '../game/aldebaranImpact';
import {
  collectIchiRevealClaws,
  ICHI_CLAW_MS,
  type IchiClawBurst,
} from '../game/ichiClaw';
import {
  collectHyogaRevealFrost,
  HYOGA_FROST_MS,
  type HyogaFrostBurst,
} from '../game/hyogaFrost';
import {
  collectSagaRevealDuplicates,
  SAGA_DUPLICATE_MS,
  type SagaDuplicateBurst,
} from '../game/sagaDuplicate';
import {
  collectCapellaRevealDisks,
  CAPELLA_DISKS_MS,
  type CapellaDiskBurst,
} from '../game/capellaDisks';
import {
  collectDanteRevealChains,
  DANTE_CHAIN_MS,
  type DanteChainBurst,
} from '../game/danteChain';
import {
  collectAndromedaRelocateBursts,
  ANDROMEDA_RELOCATE_MS,
  type AndromedaRelocateBurst,
} from '../game/andromedaRelocate';
import { buildRevealTimeline } from '../game/revealVfx';
import type { GameState, LocationIndex, PlayerId } from '../game/types';

/** Cadence de la révélation carte par carte (ms entre deux retournements). */
const REVEAL_STEP_MS = 520;
/** Pause supplémentaire quand une carte déclenche un effet au révélé. */
const REVEAL_EFFECT_PAUSE_MS = 420;
import { useDeckStore } from './deckStore';

interface GameStore {
  state: GameState;
  /** UI-only flag: true while the reveal animation is playing. */
  resolving: boolean;
  /** Flèches Ptolémée actives (révélé uniquement). */
  ptolemyArrowBursts: PtolemyArrowShot[];
  /** Impacts Milo actifs (révélé uniquement). */
  miloImpactBursts: MiloImpactBurst[];
  /** Plasma Aiolia actif (révélé uniquement). */
  aioliaPlasmaBursts: AioliaPlasmaBurst[];
  /** Boules de feu Babel actives (révélé uniquement). */
  babelFireballBursts: BabelFireballBurst[];
  /** Flèches Aiolos actives (révélé uniquement). */
  aiolosArrowBursts: AiolosArrowShot[];
  /** Phénix Ikki actif (révélé uniquement). */
  ikkiPhoenixBursts: IkkiPhoenixBurst[];
  /** Corbeaux Jamian actifs (révélé uniquement). */
  jamianCrowBursts: JamianCrowBurst[];
  /** Dragon Shiryu — tick +1 fin de tour. */
  shiryuDragonBursts: ShiryuDragonBurst[];
  /** Lames Shura — révélé uniquement. */
  shuraBladeBursts: ShuraBladeBurst[];
  /** Fantômes DeathMask — révélé uniquement. */
  deathmaskSoulBursts: DeathmaskSoulBurst[];
  /** Aldébaran — atterrissage lourd au révélé. */
  aldebaranImpactBursts: AldebaranImpactBurst[];
  /** Ichi — coup de griffe au révélé. */
  ichiClawBursts: IchiClawBurst[];
  /** Hyoga — jet de flocons + prison de glace au révélé. */
  hyogaFrostBursts: HyogaFrostBurst[];
  /** Saga — duplication vers un autre lieu au révélé. */
  sagaDuplicateBursts: SagaDuplicateBurst[];
  capellaDiskBursts: CapellaDiskBurst[];
  danteChainBursts: DanteChainBurst[];
  /** Île d'Andromède — déplacement vers un autre lieu au révélé. */
  andromedaRelocateBursts: AndromedaRelocateBurst[];
  /** When set, the detail modal shows the card instance with this uid. */
  inspectedUid: string | null;
  /** When set, the detail modal shows this lane's location effect. */
  inspectedLane: LocationIndex | null;
  /** Incrémenté à chaque nouvelle partie (idempotence récompenses). */
  matchSerial: number;
  /** Deck éphémère du dernier match Infinity (pour Rejouer). */
  lastInfinityDeckIds: string[] | null;
  newGame: () => void;
  /** Lance une partie sandbox Infinity avec un deck éphémère. */
  newInfinityGame: (deckIds: string[]) => void;
  playCard: (playerId: PlayerId, uid: string, lane: LocationIndex) => void;
  unplayCard: (playerId: PlayerId, uid: string) => void;
  endTurn: () => void;
  inspectCard: (uid: string | null) => void;
  inspectLocation: (lane: LocationIndex | null) => void;
}

export const useGame = create<GameStore>((set, get) => ({
  state: createInitialState(),
  resolving: false,
  ptolemyArrowBursts: [],
  miloImpactBursts: [],
  aioliaPlasmaBursts: [],
  babelFireballBursts: [],
  aiolosArrowBursts: [],
  ikkiPhoenixBursts: [],
  jamianCrowBursts: [],
  shiryuDragonBursts: [],
  shuraBladeBursts: [],
  deathmaskSoulBursts: [],
  aldebaranImpactBursts: [],
  ichiClawBursts: [],
  hyogaFrostBursts: [],
  sagaDuplicateBursts: [],
  capellaDiskBursts: [],
  danteChainBursts: [],
  andromedaRelocateBursts: [],
  matchSerial: 0,
  lastInfinityDeckIds: null,
  inspectedUid: null,
  inspectedLane: null,
  newGame: () => {
    const deckStore = useDeckStore.getState();
    const active = deckStore.getActiveDeck();
    const playerDeckIds = deckStore.isActiveDeckValid()
      ? active.cardIds
      : undefined;
    set((s) => ({
      matchSerial: s.matchSerial + 1,
      lastInfinityDeckIds: null,
      state: createInitialState({ playerDeckIds, mode: 'standard' }),
      resolving: false,
      ptolemyArrowBursts: [],
      miloImpactBursts: [],
      aioliaPlasmaBursts: [],
      babelFireballBursts: [],
      aiolosArrowBursts: [],
      ikkiPhoenixBursts: [],
      jamianCrowBursts: [],
      shiryuDragonBursts: [],
      shuraBladeBursts: [],
      deathmaskSoulBursts: [],
      aldebaranImpactBursts: [],
      ichiClawBursts: [],
      hyogaFrostBursts: [],
      sagaDuplicateBursts: [],
      capellaDiskBursts: [],
      danteChainBursts: [],
      andromedaRelocateBursts: [],
      inspectedUid: null,
      inspectedLane: null,
    }));
  },
  newInfinityGame: (deckIds) => {
    const ids = deckIds.slice(0, 12);
    set((s) => ({
      matchSerial: s.matchSerial + 1,
      lastInfinityDeckIds: [...ids],
      state: createInitialState({ playerDeckIds: ids, mode: 'infinity' }),
      resolving: false,
      ptolemyArrowBursts: [],
      miloImpactBursts: [],
      aioliaPlasmaBursts: [],
      babelFireballBursts: [],
      aiolosArrowBursts: [],
      ikkiPhoenixBursts: [],
      jamianCrowBursts: [],
      shiryuDragonBursts: [],
      shuraBladeBursts: [],
      deathmaskSoulBursts: [],
      aldebaranImpactBursts: [],
      ichiClawBursts: [],
      hyogaFrostBursts: [],
      sagaDuplicateBursts: [],
      capellaDiskBursts: [],
      danteChainBursts: [],
      andromedaRelocateBursts: [],
      inspectedUid: null,
      inspectedLane: null,
    }));
  },
  playCard: (playerId, uid, lane) => {
    const next = playCard(get().state, playerId, uid, lane);
    set({ state: next });
  },
  unplayCard: (playerId, uid) => {
    const next = unplayCard(get().state, playerId, uid);
    set({ state: next });
  },
  endTurn: () => {
    const { state: current, resolving } = get();
    if (current.phase !== 'play' || resolving) return;
    set({
      resolving: true,
      inspectedUid: null,
      inspectedLane: null,
      ptolemyArrowBursts: [],
      miloImpactBursts: [],
      aioliaPlasmaBursts: [],
      babelFireballBursts: [],
      aiolosArrowBursts: [],
      ikkiPhoenixBursts: [],
      jamianCrowBursts: [],
      shiryuDragonBursts: [],
      shuraBladeBursts: [],
      deathmaskSoulBursts: [],
      aldebaranImpactBursts: [],
      ichiClawBursts: [],
      hyogaFrostBursts: [],
      sagaDuplicateBursts: [],
      capellaDiskBursts: [],
      danteChainBursts: [],
      andromedaRelocateBursts: [],
    });
    // Run AI in a microtask so the "thinking" indicator shows up.
    setTimeout(() => {
      const afterAi = aiTakeTurn(current);
      const afterReveal = endTurn(afterAi);
      const timeline = buildRevealTimeline(afterAi, afterReveal);

      const ptolemyBursts = collectPtolemyRevealShots(afterAi, afterReveal);
      const miloBursts = collectMiloRevealImpacts(afterAi, afterReveal);
      const aioliaBursts = collectAioliaRevealPlasma(afterAi, afterReveal);
      const babelBursts = collectBabelRevealFireballs(afterAi, afterReveal);
      const aiolosBursts = collectAiolosRevealArrows(afterAi, afterReveal);
      const ikkiBursts = collectIkkiRevealPhoenix(afterAi, afterReveal);
      const beforeJamian = revealPhaseUntilJamian(afterAi);
      const jamianBursts = collectJamianEndOfRevealCrows(beforeJamian, afterReveal);
      const shiryuBursts = collectShiryuDeathBursts(afterAi, afterReveal);
      const shuraBursts = collectShuraRevealBlades(afterAi, afterReveal);
      const deathmaskBursts = collectDeathmaskRevealSouls(afterAi, afterReveal);
      const aldebaranBursts = collectAldebaranRevealImpacts(afterAi, afterReveal);
      const ichiBursts = collectIchiRevealClaws(afterAi, afterReveal);
      const hyogaBursts = collectHyogaRevealFrost(afterAi, afterReveal);
      const sagaBursts = collectSagaRevealDuplicates(afterAi, afterReveal);
      const capellaBursts = collectCapellaRevealDisks(afterAi, afterReveal);
      const danteBursts = collectDanteRevealChains(afterAi, afterReveal);
      const andromedaBursts = collectAndromedaRelocateBursts(afterAi, afterReveal);

      const clearBurst = (sourceUid: string, durationMs: number) => {
        setTimeout(() => {
          set((prev) => ({
            ptolemyArrowBursts: prev.ptolemyArrowBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            miloImpactBursts: prev.miloImpactBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            aioliaPlasmaBursts: prev.aioliaPlasmaBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            babelFireballBursts: prev.babelFireballBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            aiolosArrowBursts: prev.aiolosArrowBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            ikkiPhoenixBursts: prev.ikkiPhoenixBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            jamianCrowBursts: prev.jamianCrowBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            shuraBladeBursts: prev.shuraBladeBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            deathmaskSoulBursts: prev.deathmaskSoulBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            aldebaranImpactBursts: prev.aldebaranImpactBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            ichiClawBursts: prev.ichiClawBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            hyogaFrostBursts: prev.hyogaFrostBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            sagaDuplicateBursts: prev.sagaDuplicateBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            capellaDiskBursts: prev.capellaDiskBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            danteChainBursts: prev.danteChainBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
            andromedaRelocateBursts: prev.andromedaRelocateBursts.filter(
              (b) => b.sourceUid !== sourceUid,
            ),
          }));
        }, durationMs);
      };

      // Aucune carte à révéler : on résout directement.
      if (timeline.length === 0) {
        set({ state: afterReveal, resolving: false });
        return;
      }

      // 1) Affiche le plateau « avant révélé » : les cartes engagées des deux
      //    camps apparaissent (celles de l'IA face cachée).
      set({ state: { ...afterAi, phase: 'reveal' } });

      // 2) Retourne les cartes une à une, dans l'ordre officiel de révélation.
      let elapsed = 0;
      timeline.forEach((frame) => {
        const stepPtolemy = ptolemyBursts.filter((b) => b.sourceUid === frame.uid);
        const stepMilo = miloBursts.filter((b) => b.sourceUid === frame.uid);
        const stepAiolia = aioliaBursts.filter((b) => b.sourceUid === frame.uid);
        const stepBabel = babelBursts.filter((b) => b.sourceUid === frame.uid);
        const stepAiolos = aiolosBursts.filter((b) => b.sourceUid === frame.uid);
        const stepIkki = ikkiBursts.filter((b) => b.sourceUid === frame.uid);
        const stepShura = shuraBursts.filter((b) => b.sourceUid === frame.uid);
        const stepDeathmask = deathmaskBursts.filter((b) => b.sourceUid === frame.uid);
        const stepAldebaran = aldebaranBursts.filter((b) => b.sourceUid === frame.uid);
        const stepIchi = ichiBursts.filter((b) => b.sourceUid === frame.uid);
        const stepHyoga = hyogaBursts.filter((b) => b.sourceUid === frame.uid);
        const stepSaga = sagaBursts.filter(
          (b) => b.side === 'player' && b.sourceUid === frame.uid,
        );
        const stepCapella = capellaBursts.filter((b) => b.sourceUid === frame.uid);
        const stepDante = danteBursts.filter((b) => b.sourceUid === frame.uid);
        const stepAndromeda = frame.andromedaRelocatePreview
          ? andromedaBursts.filter((b) => b.sourceUid === frame.uid)
          : [];
        const hasEffect =
          stepPtolemy.length +
            stepMilo.length +
            stepAiolia.length +
            stepBabel.length +
            stepAiolos.length +
            stepIkki.length +
            stepShura.length +
            stepDeathmask.length +
            stepAldebaran.length +
            stepIchi.length +
            stepHyoga.length +
            stepSaga.length +
            stepCapella.length +
            stepDante.length >
          0;

        const at = elapsed;
        setTimeout(() => {
          set((prev) => ({
            state: frame.state,
            ptolemyArrowBursts: [...prev.ptolemyArrowBursts, ...stepPtolemy],
            miloImpactBursts: [...prev.miloImpactBursts, ...stepMilo],
            aioliaPlasmaBursts: [...prev.aioliaPlasmaBursts, ...stepAiolia],
            babelFireballBursts: [...prev.babelFireballBursts, ...stepBabel],
            aiolosArrowBursts: [...prev.aiolosArrowBursts, ...stepAiolos],
            ikkiPhoenixBursts: [...prev.ikkiPhoenixBursts, ...stepIkki],
            shuraBladeBursts: [...prev.shuraBladeBursts, ...stepShura],
            deathmaskSoulBursts: [...prev.deathmaskSoulBursts, ...stepDeathmask],
            aldebaranImpactBursts: [...prev.aldebaranImpactBursts, ...stepAldebaran],
            ichiClawBursts: [...prev.ichiClawBursts, ...stepIchi],
            hyogaFrostBursts: [...prev.hyogaFrostBursts, ...stepHyoga],
            sagaDuplicateBursts: [...prev.sagaDuplicateBursts, ...stepSaga],
            capellaDiskBursts: [...prev.capellaDiskBursts, ...stepCapella],
            danteChainBursts: [...prev.danteChainBursts, ...stepDante],
            andromedaRelocateBursts: frame.andromedaRelocatePreview
              ? [...prev.andromedaRelocateBursts, ...stepAndromeda]
              : prev.andromedaRelocateBursts.filter(
                  (b) => b.sourceUid !== frame.uid,
                ),
          }));
          if (stepPtolemy.length) clearBurst(frame.uid, PTOLEMY_ARROW_MS);
          if (stepMilo.length) clearBurst(frame.uid, MILO_IMPACT_MS);
          if (stepAiolia.length) clearBurst(frame.uid, AIOLIA_PLASMA_MS);
          if (stepBabel.length) clearBurst(frame.uid, BABEL_FIREBALL_MS);
          if (stepAiolos.length) clearBurst(frame.uid, AIOLOS_ARROW_MS);
          if (stepIkki.length) clearBurst(frame.uid, IKKI_PHOENIX_MS);
          if (stepShura.length) clearBurst(frame.uid, SHURA_BLADE_MS);
          if (stepDeathmask.length) clearBurst(frame.uid, DEATHMASK_SOULS_MS);
          if (stepAldebaran.length) clearBurst(frame.uid, ALDEBARAN_IMPACT_MS);
          if (stepIchi.length) {
            const maxDelay = Math.max(
              0,
              ...stepIchi.map((b) => (b.delayMs ?? 0) + ICHI_CLAW_MS),
            );
            clearBurst(frame.uid, maxDelay || ICHI_CLAW_MS);
          }
          if (stepHyoga.length) clearBurst(frame.uid, HYOGA_FROST_MS);
          if (stepSaga.length) clearBurst(frame.uid, SAGA_DUPLICATE_MS);
          if (stepCapella.length) clearBurst(frame.uid, CAPELLA_DISKS_MS);
          if (stepDante.length) clearBurst(frame.uid, DANTE_CHAIN_MS);
          if (stepAndromeda.length) clearBurst(frame.uid, ANDROMEDA_RELOCATE_MS);
        }, at);

        elapsed += REVEAL_STEP_MS;
        if (frame.andromedaRelocatePreview) {
          elapsed += ANDROMEDA_RELOCATE_MS;
        }
        if (hasEffect) {
          elapsed += REVEAL_EFFECT_PAUSE_MS;
        }
      });

      // 3) Résolution finale : Jamian, comète Shiryu, tour suivant.
      setTimeout(() => {
        if (jamianBursts.length > 0) {
          set({
            state: beforeJamian,
            resolving: false,
            shiryuDragonBursts: shiryuBursts,
            jamianCrowBursts: jamianBursts,
          });
          setTimeout(() => {
            set({ state: afterReveal, jamianCrowBursts: [] });
          }, JAMIAN_CROWS_MS);
        } else {
          set({
            state: afterReveal,
            resolving: false,
            shiryuDragonBursts: shiryuBursts,
            jamianCrowBursts: [],
          });
        }
        if (shiryuBursts.length > 0) {
          setTimeout(() => set({ shiryuDragonBursts: [] }), SHIRYU_DRAGON_MS);
        }
      }, elapsed);
    }, 600);
  },
  inspectCard: (uid) =>
    set(
      uid !== null
        ? { inspectedUid: uid, inspectedLane: null }
        : { inspectedUid: null },
    ),
  inspectLocation: (lane) =>
    set(
      lane !== null
        ? { inspectedLane: lane, inspectedUid: null }
        : { inspectedLane: null },
    ),
}));
