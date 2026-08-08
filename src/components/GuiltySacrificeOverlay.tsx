import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import { getCardArtPath } from '../game/cardArt';
import type { GuiltySacrificeBurst } from '../game/guiltySacrifice';
import type { LocationIndex } from '../game/types';
import {
  measureCardCenter,
  measureSlotCenter,
  scheduleVfxMeasure,
} from '../game/vfxMeasure';

interface Props {
  laneIndex: LocationIndex;
  bursts: GuiltySacrificeBurst[];
  containerRef: RefObject<HTMLElement | null>;
  compact?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface ShotGeom {
  key: string;
  source: Point;
  targets: Array<Point & { stagger: number; power: number }>;
  basePower: number;
  finalPower: number;
  maskUrl: string | null;
}

const MASK_ART = getCardArtPath('guilty');

function measureBurst(
  container: HTMLElement,
  burst: GuiltySacrificeBurst,
  compact: boolean,
): ShotGeom | null {
  const source =
    measureCardCenter(container, burst.sourceUid) ??
    measureSlotCenter(container, burst.side, burst.sourceSlotIndex, compact);
  if (!source) return null;

  const targets = burst.targets
    .map((t) => {
      const hit =
        measureCardCenter(container, t.targetUid) ??
        measureSlotCenter(container, burst.side, t.slotIndex, compact);
      if (!hit) return null;
      return { ...hit, stagger: t.stagger, power: t.power };
    })
    .filter((t): t is Point & { stagger: number; power: number } => t !== null);

  if (targets.length === 0) return null;

  return {
    key: `${burst.sourceUid}-guilty-${burst.lane}`,
    source,
    targets,
    basePower: burst.basePower,
    finalPower: burst.finalPower,
    maskUrl: MASK_ART,
  };
}

/** Sacrifice démoniaque — au révélé de Guilty. */
export function GuiltySacrificeOverlay({
  laneIndex,
  bursts,
  containerRef,
  compact = false,
}: Props) {
  const laneBursts = useMemo(
    () => bursts.filter((b) => b.lane === laneIndex),
    [bursts, laneIndex],
  );
  const [shots, setShots] = useState<ShotGeom[]>([]);

  useLayoutEffect(() => {
    if (laneBursts.length === 0) {
      setShots([]);
      return;
    }

    return scheduleVfxMeasure(containerRef, (container) => {
      const next = laneBursts
        .map((burst) => measureBurst(container, burst, compact))
        .filter((g): g is ShotGeom => g !== null);
      setShots(next);
    });
  }, [containerRef, laneBursts, compact]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const maxStagger = Math.max(...shot.targets.map((t) => t.stagger), 0);
        const absorbStart = 0.85;
        const finaleAt = absorbStart + maxStagger * 0.42 + 0.55;

        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="lane-vfx-layer pointer-events-none overflow-visible guilty-sacrifice"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 1 — Guilty s’illumine */}
            <motion.span
              className="guilty-sacrifice__glow"
              style={{ left: shot.source.x, top: shot.source.y }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: [0, 0.95, 0.7, 0.85, 0],
                scale: [0.4, 1.35, 1.55, 1.8, 2.2],
              }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />

            {/* 2 — Flammes noires envahissent le lieu */}
            <motion.span
              className="guilty-sacrifice__flames"
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: [0, 0.75, 0.55, 0], scaleY: [0.4, 1, 1.05, 1.1] }}
              transition={{ duration: 1.6, delay: 0.12, ease: 'easeOut' }}
            />
            <motion.span
              className="guilty-sacrifice__flames guilty-sacrifice__flames--ember"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.35, 0] }}
              transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
            />

            {/* 3 — Masque démoniaque derrière Guilty */}
            {shot.maskUrl ? (
              <motion.img
                src={shot.maskUrl}
                alt=""
                draggable={false}
                className="guilty-sacrifice__mask"
                style={{ left: shot.source.x, top: shot.source.y }}
                initial={{ opacity: 0, scale: 0.55, y: 18 }}
                animate={{
                  opacity: [0, 0.55, 0.72, 0.4, 0],
                  scale: [0.55, 1.15, 1.35, 1.55, 1.7],
                  y: [18, -8, -14, -22, -30],
                }}
                transition={{ duration: 2.2, delay: 0.28, ease: 'easeOut' }}
              />
            ) : (
              <motion.span
                className="guilty-sacrifice__mask-fallback"
                style={{ left: shot.source.x, top: shot.source.y }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.7, 0.5, 0], scale: [0.5, 1.4, 1.7, 2] }}
                transition={{ duration: 1.8, delay: 0.28, ease: 'easeOut' }}
              />
            )}

            {/* 4–6 — Aura rouge, explosion, cosmos aspiré */}
            {shot.targets.map((target) => {
              const delay = 0.55 + target.stagger * 0.42;
              const dx = shot.source.x - target.x;
              const dy = shot.source.y - target.y;

              return (
                <span key={`${shot.key}-${target.stagger}`}>
                  <motion.span
                    className="guilty-sacrifice__aura"
                    style={{ left: target.x, top: target.y }}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{
                      opacity: [0, 0.95, 0.8, 0],
                      scale: [0.3, 1.15, 1.35, 1.7],
                    }}
                    transition={{ duration: 0.55, delay, ease: 'easeOut' }}
                  />
                  <motion.span
                    className="guilty-sacrifice__blast"
                    style={{ left: target.x, top: target.y }}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{
                      opacity: [0, 0, 1, 0],
                      scale: [0.2, 0.2, 1.4, 2.1],
                    }}
                    transition={{
                      duration: 0.55,
                      delay: delay + 0.18,
                      times: [0, 0.35, 0.55, 1],
                      ease: 'easeOut',
                    }}
                  />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span
                      key={i}
                      className="guilty-sacrifice__spark"
                      style={{ left: target.x, top: target.y }}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                      animate={{
                        opacity: [0, 1, 0.85, 0],
                        x: [0, dx * (0.35 + i * 0.12), dx],
                        y: [
                          0,
                          dy * (0.28 + i * 0.1) - 12 + i * 4,
                          dy,
                        ],
                        scale: [0.4, 1.1, 0.55, 0.2],
                      }}
                      transition={{
                        duration: 0.62,
                        delay: delay + 0.28 + i * 0.03,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </span>
              );
            })}

            {/* 7 — Compteur de puissance */}
            <motion.span
              className="guilty-sacrifice__power"
              style={{ left: shot.source.x, top: shot.source.y }}
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{
                opacity: [0, 0, 1, 1, 0],
                scale: [0.6, 0.6, 1.15, 1.25, 1.4],
                y: [10, 10, -28, -36, -48],
              }}
              transition={{
                duration: finaleAt + 0.4,
                times: [0, 0.35, 0.45, 0.85, 1],
                ease: 'easeOut',
              }}
            >
              <PowerTicker from={shot.basePower} to={shot.finalPower} />
            </motion.span>

            {/* 8 — Explosion finale de cosmos */}
            <motion.span
              className="guilty-sacrifice__finale"
              style={{ left: shot.source.x, top: shot.source.y }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 0, 0.95, 0],
                scale: [0.3, 0.3, 1.6, 2.4],
              }}
              transition={{
                duration: 0.9,
                delay: finaleAt,
                times: [0, 0.15, 0.45, 1],
                ease: 'easeOut',
              }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

function PowerTicker({ from, to }: { from: number; to: number }) {
  const [value, setValue] = useState(from);

  useLayoutEffect(() => {
    setValue(from);
    const delta = Math.max(0, to - from);
    const steps = Math.min(8, Math.max(1, delta));
    const timers: number[] = [];
    for (let i = 1; i <= steps; i += 1) {
      const next = Math.round(from + (delta * i) / steps);
      timers.push(window.setTimeout(() => setValue(next), 520 + i * 320));
    }
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [from, to]);

  return <>{value}</>;
}
