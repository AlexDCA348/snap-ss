import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { AldebaranImpactBurst } from '../game/aldebaranImpact';
import type { LocationIndex } from '../game/types';
import { measureSlotCenter, scheduleVfxMeasure } from '../game/vfxMeasure';

interface Props {
  laneIndex: LocationIndex;
  bursts: AldebaranImpactBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface ImpactGeom {
  key: string;
  x: number;
  y: number;
}

const DEBRIS = [
  { angle: -72, dist: 0.55, delay: 0.1 },
  { angle: -28, dist: 0.62, delay: 0.12 },
  { angle: 18, dist: 0.48, delay: 0.08 },
  { angle: 64, dist: 0.58, delay: 0.14 },
  { angle: 112, dist: 0.52, delay: 0.11 },
  { angle: 156, dist: 0.46, delay: 0.09 },
] as const;

function measureBurst(
  container: HTMLElement,
  burst: AldebaranImpactBurst,
  compact: boolean,
): ImpactGeom | null {
  const center = measureSlotCenter(
    container,
    burst.side,
    burst.slotIndex,
    compact,
  );
  if (!center) return null;

  return {
    key: burst.sourceUid,
    x: center.x,
    y: center.y,
  };
}

/** Aldébaran — onde de choc au révélé (sans sprite pierre). */
export function AldebaranImpactOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [impacts, setImpacts] = useState<ImpactGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setImpacts([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst, compact))
        .filter((g): g is ImpactGeom => g !== null);
      setImpacts(next);
    });
  }, [compact, containerRef, laneBursts]);

  if (impacts.length === 0) return null;

  return (
    <AnimatePresence>
      {impacts.map((hit) => (
        <motion.div
          key={hit.key}
          aria-hidden
          className="lane-vfx-layer pointer-events-none overflow-visible"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="aldebaran-impact__flash"
            style={{ left: hit.x, top: hit.y }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.2, 1.35, 1.8] }}
            transition={{ duration: 0.5, delay: 0, ease: 'easeOut' }}
          />

          <motion.span
            className="aldebaran-impact__crater"
            style={{ left: hit.x, top: hit.y }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.85, 0.45, 0], scale: [0.3, 1, 1.15, 1.35] }}
            transition={{ duration: 0.75, delay: 0, ease: 'easeOut' }}
          />

          <motion.span
            className="aldebaran-impact__shock aldebaran-impact__shock--a"
            style={{ left: hit.x, top: hit.y }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.6, 2.2] }}
            transition={{ duration: 0.62, delay: 0.02, ease: 'easeOut' }}
          />
          <motion.span
            className="aldebaran-impact__shock aldebaran-impact__shock--b"
            style={{ left: hit.x, top: hit.y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.35, 1.9] }}
            transition={{ duration: 0.78, delay: 0.08, ease: 'easeOut' }}
          />

          {DEBRIS.map((chunk, i) => (
            <motion.span
              key={`${hit.key}-debris-${i}`}
              className="aldebaran-impact__debris"
              style={{ left: hit.x, top: hit.y, rotate: chunk.angle }}
              initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0.2, 1, 0.7],
                x: Math.cos((chunk.angle * Math.PI) / 180) * 52 * chunk.dist,
                y: Math.sin((chunk.angle * Math.PI) / 180) * 36 * chunk.dist,
              }}
              transition={{
                duration: 0.55,
                delay: chunk.delay,
                ease: 'easeOut',
              }}
            />
          ))}

          <motion.span
            className="aldebaran-impact__dust"
            style={{ left: hit.x, top: hit.y }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.65, 0], scale: [0.6, 1.45, 1.85] }}
            transition={{ duration: 0.85, delay: 0.04, ease: 'easeOut' }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
