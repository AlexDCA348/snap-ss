import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import { auraUrl } from '../game/auraAssets';
import type { ShiryuDragonBurst } from '../game/shiryuDragon';
import { measureLaneSlotViewport } from '../game/vfxMeasure';

const DRAGON_SPRITE = auraUrl('shiryu/dragon-sprite.svg');

interface Props {
  bursts: ShiryuDragonBurst[];
  compact?: boolean;
}

interface CometGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function measureBurst(burst: ShiryuDragonBurst, compact: boolean): CometGeom | null {
  const start = measureLaneSlotViewport(
    burst.lane,
    burst.side,
    burst.slotIndex,
    compact,
  );
  if (!start) return null;

  return {
    key: burst.id,
    x1: start.x,
    y1: start.y,
    x2: start.x + (compact ? 280 : 360),
    y2: start.y - (compact ? 220 : 300),
  };
}

/** Dragon Shiryu — comète à la destruction. */
export function ShiryuDragonCometOverlay({ bursts, compact = false }: Props) {
  const [comets, setComets] = useState<CometGeom[]>([]);

  const burstKey = useMemo(() => bursts.map((b) => b.id).join('|'), [bursts]);

  useLayoutEffect(() => {
    if (bursts.length === 0) {
      setComets([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = bursts
        .map((burst) => measureBurst(burst, compact))
        .filter((g): g is CometGeom => g !== null);
      if (next.length > 0) setComets(next);
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

  if (comets.length === 0) return null;

  return (
    <AnimatePresence>
      {comets.map((comet) => {
        const dx = comet.x2 - comet.x1;
        const dy = comet.y2 - comet.y1;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

        return (
          <motion.div
            key={comet.key}
            aria-hidden
            className="shiryu-comet-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="shiryu-comet__streak"
              style={{
                left: comet.x1,
                top: comet.y1,
                rotate: angle,
              }}
              initial={{ opacity: 0, scaleX: 0.1 }}
              animate={{ opacity: [0, 0.9, 0.6, 0], scaleX: [0.1, 1, 1.2, 0.8] }}
              transition={{ duration: 1.35, ease: 'easeOut' }}
            />

            <motion.div
              className="shiryu-comet__dragon"
              style={{ left: comet.x1, top: comet.y1 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: -12 }}
              animate={{
                x: [0, dx * 0.35, dx * 0.72, dx],
                y: [0, dy * 0.35, dy * 0.72, dy],
                opacity: [0, 1, 1, 0.85, 0],
                scale: [0.4, 0.95, 1.08, 1.15, 0.7],
                rotate: [-12, 4, 8, 14, 18],
              }}
              transition={{
                duration: 1.45,
                ease: [0.22, 0.68, 0.24, 1],
                times: [0, 0.25, 0.55, 0.85, 1],
              }}
            >
              <img
                src={DRAGON_SPRITE}
                alt=""
                draggable={false}
                className="shiryu-comet__sprite"
              />
              <span className="shiryu-comet__tail" />
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
