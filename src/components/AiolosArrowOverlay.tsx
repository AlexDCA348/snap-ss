import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { AiolosArrowShot } from '../game/aiolosArrow';
import { auraUrl } from '../game/auraAssets';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const ARROW_SPRITE = auraUrl('aiolos/arrow-gold-sprite.svg');

interface Props {
  laneIndex: LocationIndex;
  bursts: AiolosArrowShot[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface ArrowGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
}

function measureBurst(
  container: HTMLElement,
  burst: AiolosArrowShot,
  compact: boolean,
): ArrowGeom | null {
  const target = measureSlotCenter(
    container,
    burst.targetSide,
    burst.slotIndex,
    compact,
  );
  if (!target) return null;

  const source = measureCardCenter(container, burst.sourceUid);
  const x1 = source?.x ?? target.x;
  const y1 = source?.y ?? target.y;
  const dx = target.x - x1;
  const dy = target.y - y1;
  if (Math.hypot(dx, dy) < 8 && !source) return null;

  return {
    key: `${burst.sourceUid}->${burst.targetSide}-${burst.slotIndex}`,
    x1,
    y1,
    x2: target.x,
    y2: target.y,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

export function AiolosArrowOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [arrows, setArrows] = useState<ArrowGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setArrows([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst, compact))
        .filter((g): g is ArrowGeom => g !== null);
      setArrows(next);
    });
  }, [compact, containerRef, laneBursts]);

  if (arrows.length === 0) return null;

  return (
    <AnimatePresence>
      {arrows.map((arrow) => (
        <motion.div
          key={arrow.key}
          aria-hidden
          className="lane-vfx-layer pointer-events-none overflow-visible"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.img
            src={ARROW_SPRITE}
            alt=""
            draggable={false}
            className="aiolos-arrow__sprite"
            style={{
              left: arrow.x1,
              top: arrow.y1,
              rotate: arrow.angle,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
            animate={{
              x: arrow.x2 - arrow.x1,
              y: arrow.y2 - arrow.y1,
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1.1, 1.05, 0.9],
            }}
            transition={{
              duration: 0.58,
              ease: 'easeIn',
              times: [0, 0.1, 0.75, 1],
            }}
          />
          <motion.span
            className="aiolos-arrow__trail"
            style={{
              left: arrow.x1,
              top: arrow.y1,
              rotate: arrow.angle,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.85, 0] }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          />
          <motion.span
            className="aiolos-arrow__impact"
            style={{ left: arrow.x2, top: arrow.y2 }}
            initial={{ opacity: 0, scale: 0.35 }}
            animate={{ opacity: [0, 1, 0], scale: [0.35, 1.35, 1.8] }}
            transition={{ duration: 0.6, delay: 0.48, ease: 'easeOut' }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
