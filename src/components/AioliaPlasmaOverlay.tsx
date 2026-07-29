import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { AioliaPlasmaBurst } from '../game/aioliaPlasma';
import type { LocationIndex } from '../game/types';
import {
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

interface Props {
  laneIndex: LocationIndex;
  bursts: AioliaPlasmaBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface PlasmaGeom {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stagger: number;
  seed: number;
}

interface PlasmaSegment {
  angle: number;
  len: number;
  delay: number;
  thick: boolean;
}

function plasmaSegments(seed: number, stagger: number): PlasmaSegment[] {
  return Array.from({ length: 10 }, (_, i) => ({
    angle: ((seed + i * 37) % 160) - 80,
    len: 0.78 + ((seed + i * 19) % 28) / 100,
    delay: stagger * 0.08 + i * 0.04,
    thick: i % 4 === 0,
  }));
}

function measureBurst(
  container: HTMLElement,
  burst: AioliaPlasmaBurst,
  compact: boolean,
): PlasmaGeom | null {
  const center = measureSlotCenter(
    container,
    burst.targetSide,
    burst.slotIndex,
    compact,
  );
  if (!center) return null;

  const slot = container.querySelector(
    `[data-lane-slot="${burst.targetSide}-${burst.slotIndex}"]`,
  ) as HTMLElement | null;
  const width = slot?.getBoundingClientRect().width ?? 72;
  const height = slot?.getBoundingClientRect().height ?? 99;

  return {
    key: `${burst.sourceUid}->${burst.targetSide}-${burst.slotIndex}`,
    x: center.x,
    y: center.y,
    width,
    height,
    stagger: burst.stagger,
    seed: burst.slotIndex * 17 + burst.stagger * 11,
  };
}

export function AioliaPlasmaOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [plasmas, setPlasmas] = useState<PlasmaGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setPlasmas([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst, compact))
        .filter((g): g is PlasmaGeom => g !== null);
      setPlasmas(next);
    });
  }, [compact, containerRef, laneBursts]);

  if (plasmas.length === 0) return null;

  return (
    <AnimatePresence>
      {plasmas.map((hit) => {
        const segments = plasmaSegments(hit.seed, hit.stagger);
        const spanW = hit.width * 1.15;

        return (
          <motion.div
            key={hit.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="aiolia-plasma__core"
              style={{ left: hit.x, top: hit.y }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.95, 0.55, 0], scale: [0.4, 1.1, 1.25, 1.5] }}
              transition={{
                duration: 0.7,
                delay: hit.stagger * 0.08,
                ease: 'easeOut',
              }}
            />

            {segments.map((seg, i) => (
              <motion.span
                key={`${hit.key}-seg-${i}`}
                className={[
                  'aiolia-plasma__segment',
                  seg.thick ? 'aiolia-plasma__segment--thick' : '',
                ].join(' ')}
                style={{
                  left: hit.x,
                  top: hit.y,
                  width: spanW * seg.len,
                  rotate: seg.angle,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{
                  opacity: [0, 1, 0.92, 0],
                  scaleX: [0, 1.05, 1, 0.85],
                }}
                transition={{
                  duration: 0.42,
                  delay: seg.delay,
                  ease: 'easeOut',
                  times: [0, 0.18, 0.55, 1],
                }}
              />
            ))}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
