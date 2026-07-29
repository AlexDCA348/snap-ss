import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import { getCardArtCandidates } from '../game/cardArt';
import type { IchiClawBurst } from '../game/ichiClaw';
import { boardCardSize, CARD_DIMENSIONS } from '../game/cardSizes';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

const ICHI_ART = getCardArtCandidates('ichi')[0] ?? '';

interface Props {
  laneIndex: LocationIndex;
  bursts: IchiClawBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface SwitchGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  delayMs: number;
}

function measureBurst(
  container: HTMLElement,
  burst: IchiClawBurst,
  compact: boolean,
): SwitchGeom | null {
  const target = measureCardCenter(container, burst.sourceUid);
  const source =
    measureSlotCenter(container, burst.fromSide, burst.sourceSlotIndex, compact) ??
    target;
  if (!source || !target) return null;

  const cardSize = boardCardSize(compact);
  const dims = CARD_DIMENSIONS[cardSize];

  return {
    key: burst.id,
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
    width: dims.width,
    height: dims.height,
    delayMs: burst.delayMs ?? 0,
  };
}

/** Trahison d'Ichi — glisse vers le camp adverse au révélé. */
export function IchiClawOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [shots, setShots] = useState<SwitchGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setShots([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst, compact))
        .filter((g): g is SwitchGeom => g !== null);
      setShots(next);
    });
  }, [containerRef, laneBursts, compact]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const dx = shot.x2 - shot.x1;
        const dy = shot.y2 - shot.y1;
        const halfW = shot.width / 2;
        const halfH = shot.height / 2;
        const delay = shot.delayMs / 1000;

        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="ichi-switch__venom-trail"
              style={{
                left: shot.x1,
                top: shot.y1,
                rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
              }}
              initial={{ opacity: 0, scaleX: 0.2 }}
              animate={{ opacity: [0, 0.8, 0.45, 0], scaleX: [0.2, 1, 1.1, 0.7] }}
              transition={{ duration: 0.75, ease: 'easeOut', delay }}
            />

            <motion.div
              className="ichi-switch__card"
              style={{
                width: shot.width,
                height: shot.height,
                marginLeft: -halfW,
                marginTop: -halfH,
              }}
              initial={{
                left: shot.x1,
                top: shot.y1,
                opacity: 0,
                scale: 0.88,
                rotate: -6,
              }}
              animate={{
                left: [shot.x1, shot.x1 + dx * 0.45, shot.x2],
                top: [shot.y1, shot.y1 + dy * 0.35 - 18, shot.y2],
                opacity: [0, 1, 1, 0.95, 0],
                scale: [0.88, 1.04, 1, 0.96, 0.88],
                rotate: [-6, 4, 0, -2, 0],
              }}
              transition={{
                duration: 0.82,
                ease: [0.42, 0, 0.2, 1],
                times: [0, 0.22, 0.62, 0.88, 1],
                delay,
              }}
            >
              {ICHI_ART ? (
                <img
                  src={ICHI_ART}
                  alt=""
                  draggable={false}
                  className="ichi-switch__card-art"
                />
              ) : (
                <div className="ichi-switch__card-fallback">★</div>
              )}
              <div className="ichi-switch__card-frame" aria-hidden />
              <div className="ichi-switch__card-shimmer" aria-hidden />
            </motion.div>

            <motion.span
              className="ichi-switch__impact"
              style={{ left: shot.x2, top: shot.y2 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0, 0.9, 0.5, 0], scale: [0.5, 0.6, 1.2, 1.4, 1.6] }}
              transition={{ duration: 0.55, delay: 0.62 + delay, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
