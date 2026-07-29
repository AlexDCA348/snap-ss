import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type CSSProperties, type RefObject } from 'react';
import type { ShuraBladeBurst } from '../game/shuraBlade';
import { auraUrl } from '../game/auraAssets';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const EXCALIBUR_BEAM = auraUrl('shura/excalibur-beam.svg');

const DEBRIS_SLOTS = [
  { x: -22, y: -8, r: -18, s: 0.85, delay: 0 },
  { x: 18, y: -14, r: 24, s: 0.7, delay: 0.04 },
  { x: -10, y: 12, r: -32, s: 0.65, delay: 0.07 },
  { x: 26, y: 8, r: 12, s: 0.8, delay: 0.1 },
  { x: -28, y: 4, r: -8, s: 0.55, delay: 0.13 },
  { x: 8, y: -20, r: 38, s: 0.75, delay: 0.05 },
] as const;

interface Props {
  laneIndex: LocationIndex;
  bursts: ShuraBladeBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface ExcaliburGeom {
  key: string;
  cx: number;
  cy: number;
  hitX: number;
  hitY: number;
  sourceX: number;
  sourceY: number;
  angle: number;
  length: number;
  thickness: number;
  stagger: number;
}

function measureExcalibur(
  container: HTMLElement,
  burst: ShuraBladeBurst,
  compact: boolean,
): ExcaliburGeom | null {
  const rect = container.getBoundingClientRect();
  const laneW = rect.width;
  const laneH = rect.height;
  if (laneW < 8 || laneH < 8) return null;

  const source = measureCardCenter(container, burst.sourceUid);
  const target =
    measureCardCenter(container, burst.targetUid) ??
    measureSlotCenter(container, burst.targetSide, burst.slotIndex, compact);
  if (!source || !target) return null;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  const length = Math.hypot(laneW, laneH) * 1.22;

  return {
    key: `${burst.sourceUid}->${burst.targetUid}`,
    cx: laneW / 2,
    cy: laneH / 2,
    hitX: target.x,
    hitY: target.y,
    sourceX: source.x,
    sourceY: source.y,
    angle,
    length,
    thickness: compact ? 34 : 46,
    stagger: burst.stagger,
  };
}

/** Excalibur — mur de lumière dorée traversant toute la lane (révélé Shura). */
export function ShuraBladeOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [slashes, setSlashes] = useState<ExcaliburGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setSlashes([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureExcalibur(container, burst, compact))
        .filter((g): g is ExcaliburGeom => g !== null);
      setSlashes(next);
    });
  }, [containerRef, laneBursts, compact]);

  if (slashes.length === 0) return null;

  return (
    <AnimatePresence>
      {slashes.map((slash) => {
        const delay = slash.stagger * 0.2;
        const beamStyle = {
          left: slash.cx,
          top: slash.cy,
          rotate: `${slash.angle}deg`,
          '--excal-len': `${slash.length}px`,
          '--excal-thick': `${slash.thickness}px`,
        } as CSSProperties;

        return (
          <motion.div
            key={slash.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="shura-excalibur__lane-haze"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.35, 0] }}
              transition={{ duration: 0.85, delay, ease: 'easeOut' }}
            />

            <motion.div
              className="shura-excalibur"
              style={beamStyle}
              initial={{ scaleY: 0, opacity: 0, filter: 'blur(8px)' }}
              animate={{
                scaleY: [0, 1.06, 1, 0.98],
                opacity: [0, 1, 1, 0],
                filter: ['blur(8px)', 'blur(1px)', 'blur(0.5px)', 'blur(6px)'],
              }}
              transition={{
                duration: 0.72,
                delay,
                ease: [0.22, 0.68, 0.2, 1],
                times: [0, 0.18, 0.55, 1],
              }}
            >
              <span className="shura-excalibur__ghost" aria-hidden />
              <span className="shura-excalibur__bloom" aria-hidden />
              <img
                src={EXCALIBUR_BEAM}
                alt=""
                draggable={false}
                className="shura-excalibur__beam"
              />
              <span className="shura-excalibur__core" aria-hidden />
              <span className="shura-excalibur__streak shura-excalibur__streak--a" aria-hidden />
              <span className="shura-excalibur__streak shura-excalibur__streak--b" aria-hidden />
              <span className="shura-excalibur__streak shura-excalibur__streak--c" aria-hidden />
            </motion.div>

            <motion.span
              className="shura-excalibur__origin-flash"
              style={{ left: slash.sourceX, top: slash.sourceY }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0.6, 0], scale: [0.4, 1.35, 1.5, 2] }}
              transition={{ duration: 0.55, delay, ease: 'easeOut' }}
            />

            <motion.span
              className="shura-excalibur__impact"
              style={{ left: slash.hitX, top: slash.hitY }}
              initial={{ opacity: 0, scaleX: 0.2, scaleY: 0.35 }}
              animate={{
                opacity: [0, 1, 0.85, 0],
                scaleX: [0.2, 1.15, 1.05, 1.35],
                scaleY: [0.35, 1.2, 1, 1.4],
              }}
              transition={{
                duration: 0.62,
                delay: delay + 0.22,
                ease: 'easeOut',
                times: [0, 0.2, 0.55, 1],
              }}
            />

            <motion.span
              className="shura-excalibur__cut-line"
              style={{
                left: slash.cx,
                top: slash.cy,
                rotate: `${slash.angle}deg`,
                width: slash.length,
                '--excal-len': `${slash.length}px`,
              } as CSSProperties}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1.05, 1], opacity: [0, 0.95, 0] }}
              transition={{
                duration: 0.48,
                delay: delay + 0.18,
                ease: 'easeOut',
              }}
            />

            {DEBRIS_SLOTS.map((d, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="shura-excalibur__debris"
                style={{ left: slash.hitX, top: slash.hitY }}
                initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0.85, 0],
                  x: [0, d.x, d.x * 1.35],
                  y: [0, d.y, d.y + 16],
                  rotate: [0, d.r, d.r * 1.2],
                  scale: [0, d.s, d.s * 0.85],
                }}
                transition={{
                  duration: 0.65,
                  delay: delay + 0.24 + d.delay,
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
