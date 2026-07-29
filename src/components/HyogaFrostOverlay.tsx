import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { HyogaFrostBurst } from '../game/hyogaFrost';
import { auraUrl } from '../game/auraAssets';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const SNOWFLAKE_PARTICLE = auraUrl('hyoga/snowflake-particle.svg');
const SNOWFLAKE_PRISON = auraUrl('hyoga/snowflake-prison.svg');

interface Props {
  laneIndex: LocationIndex;
  bursts: HyogaFrostBurst[];
  containerRef: RefObject<HTMLElement | null>;
}

interface FrostGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
}

const SNOWFLAKE_WAVES = [
  { delay: 0, spread: -14, scale: 0.72, rotate: -18 },
  { delay: 0.06, spread: -7, scale: 0.85, rotate: 8 },
  { delay: 0.12, spread: 0, scale: 1, rotate: 0 },
  { delay: 0.18, spread: 7, scale: 0.88, rotate: -10 },
  { delay: 0.24, spread: 14, scale: 0.78, rotate: 14 },
  { delay: 0.3, spread: -4, scale: 0.66, rotate: 22 },
];

function measureBurst(
  container: HTMLElement,
  burst: HyogaFrostBurst,
): FrostGeom | null {
  const source = measureCardCenter(container, burst.sourceUid);
  const target = measureCardCenter(container, burst.targetUid);
  if (!target) return null;

  const x1 = source?.x ?? target.x;
  const y1 = source?.y ?? target.y;
  const dx = target.x - x1;
  const dy = target.y - y1;

  return {
    key: `${burst.sourceUid}->${burst.targetUid}`,
    x1,
    y1,
    x2: target.x,
    y2: target.y,
    angle: Math.hypot(dx, dy) >= 8 ? (Math.atan2(dy, dx) * 180) / Math.PI : 0,
  };
}

/** Poussière de Diamant — jet de flocons puis prison de glace au révélé d'Hyoga. */
export function HyogaFrostOverlay({ laneIndex, bursts, containerRef }: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [shots, setShots] = useState<FrostGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setShots([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst))
        .filter((g): g is FrostGeom => g !== null);
      setShots(next);
    });
  }, [containerRef, laneBursts]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const dx = shot.x2 - shot.x1;
        const dy = shot.y2 - shot.y1;
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
            {SNOWFLAKE_WAVES.map((wave, i) => {
              const offset = wave.spread * 0.38;
              const startX = shot.x1 + perpX * offset;
              const startY = shot.y1 + perpY * offset;
              const endX = shot.x2 + perpX * offset * 0.25;
              const endY = shot.y2 + perpY * offset * 0.25;

              return (
                <motion.img
                  key={`${shot.key}-flake-${i}`}
                  src={SNOWFLAKE_PARTICLE}
                  alt=""
                  draggable={false}
                  className="hyoga-frost__particle"
                  style={{
                    left: startX,
                    top: startY,
                    rotate: shot.angle + wave.rotate,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.35, rotate: wave.rotate }}
                  animate={{
                    x: endX - startX,
                    y: endY - startY,
                    opacity: [0, 1, 1, 0.35, 0],
                    scale: [0.35, wave.scale, wave.scale * 0.95, 0.8, 0.55],
                    rotate: wave.rotate + 120,
                  }}
                  transition={{
                    duration: 0.48,
                    delay: wave.delay,
                    ease: 'easeIn',
                    times: [0, 0.12, 0.55, 0.82, 1],
                  }}
                />
              );
            })}

            <motion.span
              className="hyoga-frost__impact-flash"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{ opacity: [0, 0.95, 0.55, 0], scale: [0.45, 1.35, 1.55, 2] }}
              transition={{ duration: 0.62, delay: 0.38, ease: 'easeOut' }}
            />

            <motion.img
              src={SNOWFLAKE_PRISON}
              alt=""
              draggable={false}
              className="hyoga-frost__prison"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.2, rotate: -24 }}
              animate={{
                opacity: [0, 0.35, 1, 1, 0.85, 0],
                scale: [0.2, 0.72, 1.08, 1.18, 1.22, 1.28],
                rotate: [-24, 8, 0, -4, 2, 6],
              }}
              transition={{
                duration: 1.15,
                delay: 0.4,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.15, 0.35, 0.55, 0.78, 1],
              }}
            />

            <motion.span
              className="hyoga-frost__prison-glow"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.75, 0.45, 0], scale: [0.5, 1.15, 1.35, 1.55] }}
              transition={{ duration: 0.9, delay: 0.42, ease: 'easeOut' }}
            />

            {[0, 1, 2].map((i) => (
              <motion.span
                key={`${shot.key}-spark-${i}`}
                className="hyoga-frost__spark"
                style={{
                  left: shot.x2 + (i - 1) * 14,
                  top: shot.y2 + (i % 2 === 0 ? -10 : 10),
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.3, 1, 1.4],
                  y: [0, -6 - i * 2, -12 - i * 3],
                }}
                transition={{
                  duration: 0.55,
                  delay: 0.44 + i * 0.08,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
