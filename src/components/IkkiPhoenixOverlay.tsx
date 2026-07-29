import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { IkkiPhoenixBurst } from '../game/ikkiPhoenix';
import { auraUrl } from '../game/auraAssets';
import {
  measureCardCenter,
  measureLaneSlotViewport,
  measureViewportCenter,
} from '../game/vfxMeasure';

const PHOENIX_SPRITE = auraUrl('ikki/phoenix-sprite.svg');
const PHOENIX_FLIGHT_S = 1.1;

const EMBER_SLOTS = [
  { x: -18, y: -8, s: 0.7, delay: 0 },
  { x: 14, y: -12, s: 0.85, delay: 0.08 },
  { x: -8, y: 10, s: 0.6, delay: 0.14 },
  { x: 20, y: 6, s: 0.75, delay: 0.2 },
] as const;

interface Props {
  bursts: IkkiPhoenixBurst[];
  compact?: boolean;
}

interface PhoenixGeom {
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

const phoenixMotion = (
  shot: PhoenixGeom,
  dxTarget: number,
  dyTarget: number,
  dxReturn: number,
  dyReturn: number,
) => ({
  x: [0, dxTarget * 0.55, dxTarget, dxTarget, dxReturn],
  y: [0, dyTarget * 0.35, dyTarget, dyTarget, dyReturn],
  opacity: [0, 0.92, 1, 1, shot.returnsToHand ? 0.85 : 0],
  scale: [0.35, 0.9, 1.15, 1.22, 0.65],
  rotate: [
    shot.angleOut,
    shot.angleOut - 5,
    shot.angleOut,
    shot.angleOut + 3,
    shot.angleBack,
  ],
});

const phoenixGhostMotion = (
  shot: PhoenixGeom,
  dxTarget: number,
  dyTarget: number,
  dxReturn: number,
  dyReturn: number,
) => ({
  ...phoenixMotion(shot, dxTarget, dyTarget, dxReturn, dyReturn),
  opacity: [0, 0.5, 0.62, 0.62, shot.returnsToHand ? 0.45 : 0],
});

const phoenixTransition = {
  duration: PHOENIX_FLIGHT_S,
  ease: [0.42, 0, 0.58, 1] as const,
  times: [0, 0.3, 0.46, 0.54, 1],
};

function measureBurst(
  burst: IkkiPhoenixBurst,
  compact: boolean,
): PhoenixGeom | null {
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
  const target = measureLaneSlotViewport(
    burst.lane,
    burst.side,
    burst.targetSlotIndex,
    compact,
  );
  if (!source || !target) return null;

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

  const dxOut = target.x - source.x;
  const dyOut = target.y - source.y;
  const dxBack = x3 - target.x;
  const dyBack = y3 - target.y;
  const hoverY = compact ? -36 : -48;

  return {
    key: `${burst.sourceUid}->${burst.targetUid}`,
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
    x3,
    y3,
    hoverY,
    angleOut: (Math.atan2(dyOut, dxOut) * 180) / Math.PI + 90,
    angleBack: (Math.atan2(dyBack, dxBack) * 180) / Math.PI + 90,
    returnsToHand,
  };
}

/** Phénix de feu — survole la carte sacrifiée puis retourne en main (Ikki, 1×). */
export function IkkiPhoenixOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<PhoenixGeom[]>([]);

  const burstKey = useMemo(
    () => bursts.map((b) => `${b.sourceUid}->${b.targetUid}`).join('|'),
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
        .filter((g): g is PhoenixGeom => g !== null);
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
        const dxTarget = shot.x2 - shot.x1;
        const dyTarget = shot.y2 - shot.y1 + shot.hoverY;
        const dxReturn = shot.x3 - shot.x1;
        const dyReturn = shot.y3 - shot.y1;

        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="ikki-phoenix-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="ikki-phoenix__sky-glow"
              style={{ left: shot.x2, top: shot.y2 + shot.hoverY }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.55, 0.35, 0], scale: [0.6, 1.4, 1.6, 1.9] }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            />

            <motion.span
              className="ikki-phoenix__trail ikki-phoenix__trail--out"
              style={{ left: shot.x1, top: shot.y1, rotate: shot.angleOut - 90 }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 0.85, 0] }}
              transition={{ duration: 0.28, delay: 0.02, ease: 'easeOut' }}
            />

            <motion.img
              src={PHOENIX_SPRITE}
              alt=""
              draggable={false}
              className="ikki-phoenix__sprite ikki-phoenix__sprite--ghost"
              style={{ left: shot.x1, top: shot.y1 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.35, rotate: shot.angleOut }}
              animate={phoenixGhostMotion(shot, dxTarget, dyTarget, dxReturn, dyReturn)}
              transition={phoenixTransition}
            />

            <motion.img
              src={PHOENIX_SPRITE}
              alt=""
              draggable={false}
              className="ikki-phoenix__sprite"
              style={{ left: shot.x1, top: shot.y1 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.35, rotate: shot.angleOut }}
              animate={phoenixMotion(shot, dxTarget, dyTarget, dxReturn, dyReturn)}
              transition={phoenixTransition}
            />

            {EMBER_SLOTS.map((ember, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="ikki-phoenix__ember"
                style={{ left: shot.x2, top: shot.y2 + shot.hoverY }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, ember.s, ember.s * 1.4],
                  x: [0, ember.x, ember.x * 1.6],
                  y: [0, ember.y, ember.y + 18],
                }}
                transition={{
                  duration: 0.42,
                  delay: 0.3 + ember.delay * 0.55,
                  ease: 'easeOut',
                }}
              />
            ))}

            <motion.span
              className="ikki-phoenix__card-burn"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: [0, 0.95, 0.85, 0],
                scale: [0.7, 1.15, 1.35, 1.6],
              }}
              transition={{
                duration: 0.48,
                delay: 0.28,
                ease: 'easeOut',
                times: [0, 0.25, 0.55, 1],
              }}
            />

            <motion.span
              className="ikki-phoenix__impact"
              style={{ left: shot.x2, top: shot.y2 + shot.hoverY }}
              initial={{ opacity: 0, scale: 0.35 }}
              animate={{ opacity: [0, 1, 0.7, 0], scale: [0.35, 1.35, 1.2, 1.75] }}
              transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            />

            <motion.span
              className="ikki-phoenix__feather-burst"
              style={{ left: shot.x2, top: shot.y2 + shot.hoverY }}
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0.5, 1.5, 2.1],
                rotate: [-20, 12, 28],
              }}
              transition={{ duration: 0.38, delay: 0.31, ease: 'easeOut' }}
            />

            {shot.returnsToHand ? (
              <motion.span
                className="ikki-phoenix__hand-flash"
                style={{ left: shot.x3, top: shot.y3 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.95, 0], scale: [0.5, 1.4, 1.85] }}
                transition={{ duration: 0.32, delay: 0.95, ease: 'easeOut' }}
              />
            ) : null}

            {shot.returnsToHand ? (
              <motion.span
                className="ikki-phoenix__trail ikki-phoenix__trail--back"
                style={{ left: shot.x2, top: shot.y2, rotate: shot.angleBack - 90 }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.3, delay: 0.45, ease: 'easeOut' }}
              />
            ) : null}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
