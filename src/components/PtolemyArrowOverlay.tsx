import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { PtolemyArrowShot } from '../game/ptolemyArrow';
import { auraUrl } from '../game/auraAssets';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const ARROW_SPRITE = auraUrl('ptolemy/arrow-sprite.svg');

interface Props {
  laneIndex: LocationIndex;
  bursts: PtolemyArrowShot[];
  containerRef: RefObject<HTMLElement | null>;
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
  burst: PtolemyArrowShot,
): ArrowGeom | null {
  const source = measureCardCenter(container, burst.sourceUid);
  const target = measureCardCenter(container, burst.targetUid);
  if (!source || !target) return null;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.hypot(dx, dy) < 8) return null;

  return {
    key: `${burst.sourceUid}->${burst.targetUid}`,
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

/** Sprite de flèche — uniquement au révélé de Ptolémée. */
export function PtolemyArrowOverlay({ laneIndex, bursts, containerRef }: Props) {
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
        .map((burst) => measureBurst(container, burst))
        .filter((g): g is ArrowGeom => g !== null);
      setArrows(next);
    });
  }, [containerRef, laneBursts]);

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
            className="ptolemy-arrow__sprite"
            style={{
              left: arrow.x1,
              top: arrow.y1,
              rotate: arrow.angle,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.65 }}
            animate={{
              x: arrow.x2 - arrow.x1,
              y: arrow.y2 - arrow.y1,
              opacity: [0, 1, 1, 0],
              scale: [0.65, 1.05, 1, 0.85],
            }}
            transition={{
              duration: 0.52,
              ease: 'easeIn',
              times: [0, 0.12, 0.78, 1],
            }}
          />
          <motion.span
            className="ptolemy-arrow__impact-sprite"
            style={{ left: arrow.x2, top: arrow.y2 }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 1.6] }}
            transition={{ duration: 0.55, delay: 0.42, ease: 'easeOut' }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
