import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { JamianCrowBurst } from '../game/jamianCrows';
import { JamianCrowSprite } from './JamianCrowSprite';
import {
  measureCardCenter,
  measureLaneSlotViewport,
  measureViewportCenter,
} from '../game/vfxMeasure';

const CROW_FLIGHT_S = 1.05;

const CROW_WAVES = [
  { delay: 0, ox: -34, oy: -22, scale: 1, rot: -16 },
  { delay: 0.03, ox: 28, oy: -26, scale: 0.92, rot: 12 },
  { delay: 0.06, ox: -18, oy: -38, scale: 0.86, rot: -8 },
  { delay: 0.09, ox: 12, oy: -42, scale: 0.95, rot: 6 },
  { delay: 0.12, ox: -42, oy: -8, scale: 0.82, rot: -22 },
  { delay: 0.15, ox: 38, oy: -12, scale: 0.88, rot: 18 },
  { delay: 0.18, ox: -8, oy: -48, scale: 0.78, rot: 0 },
  { delay: 0.21, ox: 22, oy: -34, scale: 0.9, rot: 10 },
  { delay: 0.24, ox: -26, oy: -32, scale: 0.84, rot: -14 },
  { delay: 0.27, ox: 6, oy: -52, scale: 0.76, rot: 4 },
  { delay: 0.3, ox: 44, oy: -28, scale: 0.8, rot: 20 },
  { delay: 0.33, ox: -46, oy: -26, scale: 0.74, rot: -18 },
] as const;

const FEATHER_SLOTS = [
  { x: -22, y: -10, s: 0.75, delay: 0 },
  { x: 16, y: -14, s: 0.9, delay: 0.06 },
  { x: -6, y: 12, s: 0.65, delay: 0.1 },
  { x: 24, y: 8, s: 0.8, delay: 0.14 },
  { x: -18, y: 16, s: 0.7, delay: 0.18 },
  { x: 8, y: -20, s: 0.85, delay: 0.22 },
] as const;

interface Props {
  bursts: JamianCrowBurst[];
  compact?: boolean;
}

interface CrowGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  hoverY: number;
  angleOut: number;
  angleBack: number;
  returnsToHand: boolean;
}

const crowMotion = (
  wave: (typeof CROW_WAVES)[number],
  shot: CrowGeom,
  dxHover: number,
  dyHover: number,
  dxReturn: number,
  dyReturn: number,
) => ({
  x: [
    0,
    dxHover * 0.45 + wave.ox * 0.35,
    dxHover + wave.ox,
    dxReturn + wave.ox * 0.25,
  ],
  y: [
    0,
    dyHover * 0.35 + wave.oy * 0.35,
    dyHover + wave.oy,
    dyReturn + wave.oy * 0.15,
  ],
  opacity: [0, 0.95, 1, shot.returnsToHand ? 0.8 : 0],
  scale: [0.2, 0.72 * wave.scale, 0.95 * wave.scale, 0.5 * wave.scale],
  rotate: [
    shot.angleOut + wave.rot,
    shot.angleOut + wave.rot - 6,
    shot.angleOut + wave.rot + 4,
    shot.angleBack + wave.rot,
  ],
});

const crowTransition = (delay: number) => ({
  duration: CROW_FLIGHT_S,
  delay,
  ease: [0.42, 0, 0.58, 1] as const,
  times: [0, 0.32, 0.48, 1],
});

function measureBurst(
  burst: JamianCrowBurst,
  compact: boolean,
): CrowGeom | null {
  const lane = document.querySelector(
    `[data-lane-index="${burst.lane}"]`,
  ) as HTMLElement | null;

  const source =
    (lane
      ? (() => {
          const rel = measureCardCenter(lane, burst.sourceUid);
          if (!rel) return null;
          const root = lane.getBoundingClientRect();
          return { x: root.left + rel.x, y: root.top + rel.y };
        })()
      : null) ??
    measureLaneSlotViewport(
      burst.lane,
      burst.side,
      burst.sourceSlotIndex,
      compact,
    );
  if (!source) return null;

  let x3 = source.x;
  let y3 = source.y;
  let returnsToHand = false;

  if (burst.side === 'player') {
    const handCard = document.querySelector(
      `[data-hand-card="${burst.sourceUid}"]`,
    ) as HTMLElement | null;
    const handPos = measureViewportCenter(handCard);
    if (handPos) {
      x3 = handPos.x;
      y3 = handPos.y;
      returnsToHand = true;
    }
  }

  const hoverY = compact ? -40 : -52;
  const x2 = source.x;
  const y2 = source.y + hoverY;
  const dxOut = x2 - source.x;
  const dyOut = y2 - source.y;
  const dxBack = x3 - x2;
  const dyBack = y3 - y2;

  return {
    key: burst.sourceUid,
    x1: source.x,
    y1: source.y,
    x2,
    y2,
    x3,
    y3,
    hoverY,
    angleOut: (Math.atan2(dyOut, dxOut) * 180) / Math.PI + 90,
    angleBack: (Math.atan2(dyBack, dxBack) * 180) / Math.PI + 90,
    returnsToHand,
  };
}

/** Essaim de corbeaux — envol de Jamian en fin de révélation, puis retour en main. */
export function JamianCrowOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<CrowGeom[]>([]);

  const burstKey = useMemo(
    () => bursts.map((b) => b.sourceUid).join('|'),
    [bursts],
  );

  useLayoutEffect(() => {
    if (bursts.length === 0) {
      setShots([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = bursts
        .map((burst) => measureBurst(burst, compact))
        .filter((g): g is CrowGeom => g !== null);
      if (next.length > 0) setShots(next);
    };

    run();
    const raf = requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    const timers = [48, 120, 240].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('resize', run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener('resize', run);
    };
  }, [burstKey, bursts, compact]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const dxHover = shot.x2 - shot.x1;
        const dyHover = shot.y2 - shot.y1;
        const dxReturn = shot.x3 - shot.x1;
        const dyReturn = shot.y3 - shot.y1;

        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="jamian-crow-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="jamian-crow__sky-glow"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: [0, 0.65, 0.4, 0], scale: [0.55, 1.35, 1.55, 1.85] }}
              transition={{ duration: 0.82, ease: 'easeOut' }}
            />

            <motion.span
              className="jamian-crow__trail jamian-crow__trail--out"
              style={{ left: shot.x1, top: shot.y1, rotate: shot.angleOut - 90 }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 0.75, 0] }}
              transition={{ duration: 0.3, delay: 0.02, ease: 'easeOut' }}
            />

            {CROW_WAVES.map((wave, i) => (
              <motion.div
                key={`${shot.key}-crow-${i}`}
                aria-hidden
                className="jamian-crow__sprite"
                style={{ left: shot.x1, top: shot.y1, zIndex: 1 + i }}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0.2,
                  rotate: shot.angleOut + wave.rot,
                }}
                animate={crowMotion(
                  wave,
                  shot,
                  dxHover,
                  dyHover,
                  dxReturn,
                  dyReturn,
                )}
                transition={crowTransition(wave.delay)}
              >
                <JamianCrowSprite uid={`${shot.key}-${i}`} className="jamian-crow__svg" />
              </motion.div>
            ))}

            {FEATHER_SLOTS.map((feather, i) => (
              <motion.span
                key={`${shot.key}-feather-${i}`}
                aria-hidden
                className="jamian-crow__feather"
                style={{ left: shot.x2, top: shot.y2 }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: -20 }}
                animate={{
                  opacity: [0, 0.95, 0],
                  scale: [0, feather.s, feather.s * 1.5],
                  x: [0, feather.x, feather.x * 1.5],
                  y: [0, feather.y, feather.y + 22],
                  rotate: [-20, 12 + i * 4, 28 + i * 6],
                }}
                transition={{
                  duration: 0.48,
                  delay: 0.26 + feather.delay * 0.55,
                  ease: 'easeOut',
                }}
              />
            ))}

            <motion.span
              className="jamian-crow__lift-burst"
              style={{ left: shot.x1, top: shot.y1 }}
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{
                opacity: [0, 0.85, 0.65, 0],
                scale: [0.65, 1.2, 1.4, 1.65],
              }}
              transition={{
                duration: 0.52,
                delay: 0.18,
                ease: 'easeOut',
                times: [0, 0.25, 0.55, 1],
              }}
            />

            <motion.span
              className="jamian-crow__impact"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.35 }}
              animate={{ opacity: [0, 0.9, 0.55, 0], scale: [0.35, 1.25, 1.15, 1.7] }}
              transition={{ duration: 0.42, delay: 0.28, ease: 'easeOut' }}
            />

            {shot.returnsToHand ? (
              <motion.span
                className="jamian-crow__hand-flash"
                style={{ left: shot.x3, top: shot.y3 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.35, 1.8] }}
                transition={{ duration: 0.34, delay: 0.88, ease: 'easeOut' }}
              />
            ) : null}

            {shot.returnsToHand ? (
              <motion.span
                className="jamian-crow__trail jamian-crow__trail--back"
                style={{ left: shot.x2, top: shot.y2, rotate: shot.angleBack - 90 }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.7, 0] }}
                transition={{ duration: 0.32, delay: 0.42, ease: 'easeOut' }}
              />
            ) : null}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
