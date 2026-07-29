import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { CapellaDiskBurst } from '../game/capellaDisks';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

interface Props {
  laneIndex: LocationIndex;
  bursts: CapellaDiskBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface DiskGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  stagger: number;
}

function measureBurst(
  container: HTMLElement,
  burst: CapellaDiskBurst,
  compact: boolean,
): DiskGeom[] {
  const source = measureCardCenter(container, burst.sourceUid);
  if (!source) return [];

  return burst.targets
    .map((target) => {
      const hit =
        measureCardCenter(container, target.targetUid) ??
        measureSlotCenter(container, burst.side, target.slotIndex, compact);
      if (!hit) return null;

      const dx = hit.x - source.x;
      const dy = hit.y - source.y;
      return {
        key: `${burst.sourceUid}->${target.targetUid}`,
        x1: source.x,
        y1: source.y,
        x2: hit.x,
        y2: hit.y,
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        stagger: target.stagger,
      };
    })
    .filter((g): g is DiskGeom => g !== null);
}

/** Disques d’Auriga — au révélé de Capella uniquement. */
export function CapellaDisksOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [disks, setDisks] = useState<DiskGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setDisks([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts.flatMap((burst) => measureBurst(container, burst, compact));
      setDisks(next);
    });
  }, [containerRef, laneBursts, compact]);

  if (disks.length === 0) return null;

  return (
    <AnimatePresence>
      {disks.map((disk) => {
        const dx = disk.x2 - disk.x1;
        const dy = disk.y2 - disk.y1;
        const delay = disk.stagger * 0.14;

        return (
          <motion.div
            key={disk.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="capella-disk__trail"
              style={{
                left: disk.x1,
                top: disk.y1,
                rotate: disk.angle,
              }}
              initial={{ opacity: 0, scaleX: 0.15 }}
              animate={{ opacity: [0, 0.85, 0.5, 0], scaleX: [0.15, 1, 1.05, 0.7] }}
              transition={{ duration: 0.42, delay, ease: 'easeOut' }}
            />

            <motion.span
              className="capella-disk__disc"
              style={{ left: disk.x1, top: disk.y1 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.35, rotate: 0 }}
              animate={{
                x: [0, dx * 0.55, dx],
                y: [0, dy * 0.55 - 10, dy],
                opacity: [0, 1, 1, 0.9, 0],
                scale: [0.35, 1.05, 1, 0.92, 0.7],
                rotate: [0, 180, 360, 540],
              }}
              transition={{
                duration: 0.58,
                delay,
                ease: [0.42, 0, 0.2, 1],
                times: [0, 0.35, 0.72, 0.9, 1],
              }}
            />

            <motion.span
              className="capella-disk__impact"
              style={{ left: disk.x2, top: disk.y2 }}
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{ opacity: [0, 0, 0.95, 0.55, 0], scale: [0.45, 0.5, 1.15, 1.35, 1.55] }}
              transition={{ duration: 0.5, delay: delay + 0.38, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
