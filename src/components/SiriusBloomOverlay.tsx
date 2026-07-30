import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { SiriusBloomBurst } from '../game/siriusBloom';
import { measureLaneSlotViewport } from '../game/vfxMeasure';
import type { PlayerId } from '../game/types';

const FLIGHT_S = 0.78;

interface Props {
  bursts: SiriusBloomBurst[];
  compact?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface BurstGeom {
  key: string;
  source: Point;
  target: Point;
  midX: number;
  midY: number;
}

function deckTarget(side: PlayerId, compact: boolean): Point | null {
  const el = document.querySelector(
    `[data-deck-zone="${side}"]`,
  ) as HTMLElement | null;
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  if (side === 'player') {
    const hand = document.querySelector('.game-hand') as HTMLElement | null;
    if (hand) {
      const r = hand.getBoundingClientRect();
      return {
        x: r.right - (compact ? 28 : 40),
        y: r.top + r.height / 2,
      };
    }
    return {
      x: window.innerWidth - (compact ? 36 : 56),
      y: window.innerHeight - (compact ? 48 : 72),
    };
  }

  return {
    x: window.innerWidth / 2,
    y: compact ? 18 : 28,
  };
}

function measureBurst(burst: SiriusBloomBurst, compact: boolean): BurstGeom | null {
  const source =
    (() => {
      const card = document.querySelector(
        `[data-lane-card="${burst.sourceUid}"]`,
      ) as HTMLElement | null;
      if (card) {
        const r = card.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return measureLaneSlotViewport(
        burst.lane,
        burst.side,
        burst.slotIndex,
        compact,
      );
    })() ?? null;
  const target = deckTarget(burst.side, compact);
  if (!source || !target) return null;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const lift = compact ? 40 : 64;

  return {
    key: `${burst.sourceUid}->deck-${burst.side}`,
    source,
    target,
    midX: source.x + dx * 0.5 + nx * (compact ? 16 : 28),
    midY: source.y + dy * 0.42 - lift,
  };
}

/** Sirius — blob rose lumineux vers le deck du propriétaire. */
export function SiriusBloomOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<BurstGeom[]>([]);

  const burstKey = useMemo(
    () => bursts.map((b) => `${b.sourceUid}:${b.side}`).join('|'),
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
        .filter((g): g is BurstGeom => g !== null);
      if (next.length > 0) setShots(next);
    };

    run();
    const raf = requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    const timers = [40, 100, 220, 380].map((ms) => window.setTimeout(run, ms));
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
      {shots.map((shot) => (
        <motion.div
          key={shot.key}
          aria-hidden
          className="sirius-bloom-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="sirius-bloom__core"
            style={{ left: 0, top: 0 }}
            initial={{
              x: shot.source.x,
              y: shot.source.y,
              scale: 0.35,
              opacity: 0,
            }}
            animate={{
              x: [shot.source.x, shot.midX, shot.target.x],
              y: [shot.source.y, shot.midY, shot.target.y],
              scale: [0.45, 1.25, 0.7],
              opacity: [0, 1, 0.85, 0],
            }}
            transition={{
              duration: FLIGHT_S,
              times: [0, 0.55, 0.88, 1],
              ease: 'easeInOut',
            }}
          />
          <motion.span
            className="sirius-bloom__halo"
            style={{ left: 0, top: 0 }}
            initial={{
              x: shot.source.x,
              y: shot.source.y,
              scale: 0.5,
              opacity: 0,
            }}
            animate={{
              x: [shot.source.x, shot.midX, shot.target.x],
              y: [shot.source.y, shot.midY, shot.target.y],
              scale: [0.7, 1.6, 1.05],
              opacity: [0, 0.7, 0.45, 0],
            }}
            transition={{
              duration: FLIGHT_S,
              times: [0, 0.55, 0.88, 1],
              ease: 'easeInOut',
            }}
          />
          <motion.span
            className="sirius-bloom__spark"
            style={{ left: shot.source.x, top: shot.source.y }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.4, 1.35, 1.7] }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
          <motion.span
            className="sirius-bloom__impact"
            style={{ left: shot.target.x, top: shot.target.y }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.3, 0.3, 1.25, 1.7] }}
            transition={{
              duration: FLIGHT_S,
              times: [0, 0.72, 0.86, 1],
              ease: 'easeOut',
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
