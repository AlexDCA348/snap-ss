import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { BabelFireballBurst } from '../game/babelFireball';
import { auraUrl } from '../game/auraAssets';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const FIREBALL_SPRITE = auraUrl('babel/fireball-sprite.svg');
const IMPACT_SPRITE = auraUrl('babel/impact-fire.svg');

interface Props {
  laneIndex: LocationIndex;
  bursts: BabelFireballBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface FireballGeom {
  key: string;
  x: number;
  y: number;
  x1: number;
  y1: number;
  angle: number;
}

const FIREBALL_WAVES = [
  { delay: 0, spread: -10, scale: 0.9 },
  { delay: 0.1, spread: 0, scale: 1 },
  { delay: 0.2, spread: 10, scale: 0.95 },
];

function measureBurst(
  container: HTMLElement,
  burst: BabelFireballBurst,
  compact: boolean,
): FireballGeom | null {
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
    x: target.x,
    y: target.y,
    x1,
    y1,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

export function BabelFireballOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [shots, setShots] = useState<FireballGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setShots([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst, compact))
        .filter((g): g is FireballGeom => g !== null);
      setShots(next);
    });
  }, [compact, containerRef, laneBursts]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const dx = shot.x - shot.x1;
        const dy = shot.y - shot.y1;
        const norm = Math.hypot(dx, dy) || 1;
        const perpX = -dy / norm;
        const perpY = dx / norm;

        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {FIREBALL_WAVES.map((wave, i) => {
              const offset = wave.spread * 0.35;
              const startX = shot.x1 + perpX * offset;
              const startY = shot.y1 + perpY * offset;
              const endX = shot.x + perpX * offset * 0.4;
              const endY = shot.y + perpY * offset * 0.4;

              return (
                <motion.img
                  key={`${shot.key}-ball-${i}`}
                  src={FIREBALL_SPRITE}
                  alt=""
                  draggable={false}
                  className="babel-fireball__sprite"
                  style={{
                    left: startX,
                    top: startY,
                    rotate: shot.angle + 90 + wave.spread * 0.15,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.45 }}
                  animate={{
                    x: endX - startX,
                    y: endY - startY,
                    opacity: [0, 1, 1, 0],
                    scale: [0.45, wave.scale, wave.scale * 0.95, 0.7],
                  }}
                  transition={{
                    duration: 0.42,
                    delay: wave.delay,
                    ease: 'easeIn',
                    times: [0, 0.12, 0.72, 1],
                  }}
                />
              );
            })}

            <motion.img
              src={IMPACT_SPRITE}
              alt=""
              draggable={false}
              className="babel-fireball__impact"
              style={{ left: shot.x, top: shot.y }}
              initial={{ opacity: 0, scale: 0.35, rotate: -8 }}
              animate={{
                opacity: [0, 1, 0.9, 0],
                scale: [0.35, 1.2, 1.05, 1.4],
                rotate: [-8, 6, 2, 14],
              }}
              transition={{
                duration: 0.58,
                delay: 0.34,
                ease: 'easeOut',
                times: [0, 0.2, 0.55, 1],
              }}
            />

            <motion.span
              className="babel-fireball__flash"
              style={{ left: shot.x, top: shot.y }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.95, 0], scale: [0.5, 1.5, 2] }}
              transition={{ duration: 0.5, delay: 0.36, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
