import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { MiloImpactBurst } from '../game/miloImpact';
import { auraUrl } from '../game/auraAssets';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const IMPACT_SPRITE = auraUrl('milo/impact-red.svg');
const NEEDLE_SPRITE = auraUrl('milo/needle-sprite.svg');

interface Props {
  laneIndex: LocationIndex;
  bursts: MiloImpactBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface ImpactGeom {
  key: string;
  x: number;
  y: number;
  x1: number;
  y1: number;
  angle: number;
  distance: number;
  stagger: number;
}

function measureImpact(
  container: HTMLElement,
  burst: MiloImpactBurst,
): ImpactGeom | null {
  const target = measureCardCenter(container, burst.targetUid);
  if (!target) return null;

  const source = measureCardCenter(container, burst.sourceUid);
  let x1 = target.x;
  let y1 = target.y;
  let angle = -90;
  let distance = 0;

  if (source) {
    x1 = source.x;
    y1 = source.y;
    const dx = target.x - x1;
    const dy = target.y - y1;
    distance = Math.hypot(dx, dy);
    if (distance >= 8) {
      angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    }
  }

  return {
    key: `${burst.sourceUid}->${burst.targetUid}`,
    x: target.x,
    y: target.y,
    x1,
    y1,
    angle,
    distance,
    stagger: burst.stagger,
  };
}

/** Impacts rouges — au révélé de Milo uniquement. */
export function MiloImpactOverlay({
  laneIndex,
  bursts,
  containerRef,
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
        .map((burst) => measureImpact(container, burst))
        .filter((g): g is ImpactGeom => g !== null);
      setImpacts(next);
    });
  }, [containerRef, laneBursts]);

  if (impacts.length === 0) return null;

  return (
    <AnimatePresence>
      {impacts.map((hit) => {
        const delay = hit.stagger * 0.09;
        const flyDist = Math.max(0, hit.distance - 24);

        return (
          <motion.div
            key={hit.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {flyDist > 8 ? (
              <motion.img
                src={NEEDLE_SPRITE}
                alt=""
                draggable={false}
                className="milo-impact__needle"
                style={{
                  left: hit.x1,
                  top: hit.y1,
                  rotate: hit.angle,
                }}
                initial={{ y: 0, opacity: 0, scaleY: 0.4 }}
                animate={{
                  y: flyDist,
                  opacity: [0, 1, 1, 0],
                  scaleY: [0.4, 1, 1, 0.7],
                }}
                transition={{
                  duration: 0.38,
                  delay,
                  ease: 'easeIn',
                  times: [0, 0.15, 0.7, 1],
                }}
              />
            ) : null}

            <motion.img
              src={IMPACT_SPRITE}
              alt=""
              draggable={false}
              className="milo-impact__burst"
              style={{ left: hit.x, top: hit.y }}
              initial={{ opacity: 0, scale: 0.35, rotate: -12 }}
              animate={{
                opacity: [0, 1, 0.85, 0],
                scale: [0.35, 1.15, 1.05, 1.35],
                rotate: [-12, 8, 4, 18],
              }}
              transition={{
                duration: 0.55,
                delay: delay + 0.28,
                ease: 'easeOut',
                times: [0, 0.2, 0.55, 1],
              }}
            />

            <motion.span
              className="milo-impact__flash"
              style={{ left: hit.x, top: hit.y }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.4, 1.8] }}
              transition={{
                duration: 0.45,
                delay: delay + 0.3,
                ease: 'easeOut',
              }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
