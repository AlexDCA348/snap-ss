import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { BlackPegasusCostBurst } from '../game/blackPegasusCost';
import { measureCardCenter, measureViewportCenter } from '../game/vfxMeasure';
import type { LocationIndex, PlayerId } from '../game/types';

interface Props {
  bursts: BlackPegasusCostBurst[];
  /** Réservé mobile — overlay déjà léger. */
  compact?: boolean;
}

interface ShotGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function laneCardViewport(
  lane: LocationIndex,
  uid: string,
): { x: number; y: number } | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (!laneEl) return null;
  const rel = measureCardCenter(laneEl, uid);
  if (!rel) return null;
  const root = laneEl.getBoundingClientRect();
  return { x: root.left + rel.x, y: root.top + rel.y };
}

function handCardViewport(
  uid: string,
  side: PlayerId,
): { x: number; y: number } | null {
  const el = document.querySelector(
    `[data-hand-card="${uid}"]`,
  ) as HTMLElement | null;
  const center = measureViewportCenter(el);
  if (center) return center;

  // Main IA non rendue — vise le haut de l'écran.
  if (side === 'ai') {
    return {
      x: window.innerWidth * 0.5,
      y: Math.max(36, window.innerHeight * 0.08),
    };
  }
  return null;
}

function measureBurst(burst: BlackPegasusCostBurst): ShotGeom | null {
  const source = laneCardViewport(burst.lane, burst.sourceUid);
  const target = handCardViewport(burst.targetUid, burst.targetSide);
  if (!source || !target) return null;
  return {
    key: `${burst.sourceUid}-${burst.targetUid}`,
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
  };
}

/** Blob rouge léger + flash noir sur la carte de main touchée. */
export function BlackPegasusCostOverlay({ bursts, compact: _compact = false }: Props) {
  const [shots, setShots] = useState<ShotGeom[]>([]);
  const burstKey = useMemo(
    () => bursts.map((b) => `${b.sourceUid}:${b.targetUid}`).join('|'),
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
        .map(measureBurst)
        .filter((g): g is ShotGeom => g !== null);
      if (next.length > 0) setShots(next);
    };

    run();
    const raf = requestAnimationFrame(run);
    const timer = window.setTimeout(run, 40);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [burstKey, bursts]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => (
        <motion.div
          key={shot.key}
          aria-hidden
          className="black-pegasus-cost-overlay fixed inset-0 z-[95] pointer-events-none overflow-visible"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="black-pegasus-cost__blob"
            style={{ left: shot.x1, top: shot.y1 }}
            initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
            animate={{
              opacity: [0, 0.9, 0.75, 0],
              scale: [0.4, 1, 0.85, 0.5],
              x: [0, (shot.x2 - shot.x1) * 0.55, shot.x2 - shot.x1],
              y: [0, (shot.y2 - shot.y1) * 0.45 - 12, shot.y2 - shot.y1],
            }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
          <motion.span
            className="black-pegasus-cost__flash"
            style={{ left: shot.x2, top: shot.y2 }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0, 0.85, 0.55, 0], scale: [0.7, 0.8, 1.15, 1.05, 0.9] }}
            transition={{ duration: 0.55, delay: 0.28, ease: 'easeOut' }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
