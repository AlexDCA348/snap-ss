import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { SagittariusArmorMergeBurst } from '../game/sagittariusArmorMerge';
import { measureCardCenter, measureLaneSlotViewport } from '../game/vfxMeasure';
import type { LocationIndex, PlayerId } from '../game/types';

interface Props {
  bursts: SagittariusArmorMergeBurst[];
  compact?: boolean;
}

interface ShotGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const SHARD_COUNT_DESKTOP = 4;
const SHARD_COUNT_COMPACT = 3;

function laneCardViewport(
  lane: LocationIndex,
  uid: string,
  side: PlayerId,
  slotIndex: number,
  compact: boolean,
): { x: number; y: number } | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (laneEl) {
    const rel = measureCardCenter(laneEl, uid);
    if (rel) {
      const root = laneEl.getBoundingClientRect();
      return { x: root.left + rel.x, y: root.top + rel.y };
    }
  }
  return measureLaneSlotViewport(lane, side, slotIndex, compact);
}

function measureBurst(
  burst: SagittariusArmorMergeBurst,
  compact: boolean,
): ShotGeom | null {
  const source = laneCardViewport(
    burst.lane,
    burst.sourceUid,
    burst.side,
    burst.sourceSlotIndex,
    compact,
  );
  const target = laneCardViewport(
    burst.lane,
    burst.targetUid,
    burst.side,
    burst.targetSlotIndex,
    compact,
  );
  if (!source || !target) return null;
  return {
    key: `${burst.sourceUid}-${burst.targetUid}`,
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
  };
}

/** Pièces d’armure dorées + petit halo — fusion légère. */
export function SagittariusArmorMergeOverlay({
  bursts,
  compact = false,
}: Props) {
  const [shots, setShots] = useState<ShotGeom[]>([]);
  const shardCount = compact ? SHARD_COUNT_COMPACT : SHARD_COUNT_DESKTOP;
  const burstKey = useMemo(
    () => bursts.map((b) => `${b.sourceUid}:${b.targetUid}`).join('|'),
    [bursts],
  );

  useLayoutEffect(() => {
    if (bursts.length === 0) {
      setShots([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = bursts
        .map((b) => measureBurst(b, compact))
        .filter((g): g is ShotGeom => g !== null);
      if (next.length > 0) setShots(next);
    };

    run();
    const raf = requestAnimationFrame(run);
    const timer = window.setTimeout(run, 40);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [burstKey, bursts, compact]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const dx = shot.x2 - shot.x1;
        const dy = shot.y2 - shot.y1;
        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="sagittarius-merge-overlay fixed inset-0 z-[94] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: shardCount }, (_, i) => {
              const spread = (i - (shardCount - 1) / 2) * (compact ? 10 : 14);
              return (
                <motion.span
                  key={i}
                  className="sagittarius-merge__shard"
                  style={{ left: shot.x1, top: shot.y1 }}
                  initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: -20 }}
                  animate={{
                    opacity: [0, 0.95, 0.8, 0],
                    scale: [0.5, 1, 0.85, 0.4],
                    x: [0, dx * 0.45 + spread, dx],
                    y: [0, dy * 0.4 - 8 - Math.abs(spread) * 0.3, dy],
                    rotate: [-20 + i * 12, 10 + i * 8, 25],
                  }}
                  transition={{
                    duration: 0.62,
                    delay: i * 0.04,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
            <motion.span
              className="sagittarius-merge__halo"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 0, 0.75, 0.4, 0],
                scale: [0.6, 0.75, 1.2, 1.05, 0.9],
              }}
              transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
