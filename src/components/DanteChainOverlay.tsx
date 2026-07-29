import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { DanteChainBurst } from '../game/danteChain';
import {
  measureCardCenter,
  measureLaneSlotViewport,
} from '../game/vfxMeasure';
import type { LocationIndex } from '../game/types';

interface Props {
  bursts: DanteChainBurst[];
  compact?: boolean;
}

interface ChainGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  stagger: number;
}

function laneCardViewport(
  lane: LocationIndex,
  uid: string,
): { x: number; y: number } | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (!laneEl) return null;

  const rel = measureCardCenter(laneEl, uid);
  if (!rel) return null;

  const root = laneEl.getBoundingClientRect();
  return { x: root.left + rel.x, y: root.top + rel.y };
}

function measureBurst(burst: DanteChainBurst, compact: boolean): ChainGeom[] {
  const source =
    laneCardViewport(burst.sourceLane, burst.sourceUid) ??
    measureLaneSlotViewport(
      burst.sourceLane,
      burst.sourceSide,
      burst.sourceSlotIndex,
      compact,
    );
  if (!source) return [];

  return burst.targets
    .map((target) => {
      const hit =
        laneCardViewport(target.lane, target.targetUid) ??
        measureLaneSlotViewport(target.lane, target.side, target.slotIndex, compact);
      if (!hit) return null;

      const dx = hit.x - source.x;
      const dy = hit.y - source.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const lift = compact ? 36 : 52;

      return {
        key: `${burst.sourceUid}->${target.targetUid}`,
        x1: source.x,
        y1: source.y,
        x2: hit.x,
        y2: hit.y,
        midX: source.x + dx * 0.45 + nx * (compact ? 18 : 28),
        midY: source.y + dy * 0.4 - lift,
        stagger: target.stagger,
      };
    })
    .filter((g): g is ChainGeom => g !== null);
}

/** Chaîne du Cerbère — au révélé de Dante (tout le plateau). */
export function DanteChainOverlay({ bursts, compact = false }: Props) {
  const [chains, setChains] = useState<ChainGeom[]>([]);

  const burstKey = useMemo(
    () =>
      bursts
        .map((b) => `${b.sourceUid}:${b.targets.map((t) => t.targetUid).join(',')}`)
        .join('|'),
    [bursts],
  );

  useLayoutEffect(() => {
    if (bursts.length === 0) {
      setChains([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = bursts.flatMap((burst) => measureBurst(burst, compact));
      if (next.length > 0) setChains(next);
    };

    run();
    const raf = requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    const timers = [48, 120, 240, 420].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('resize', run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener('resize', run);
    };
  }, [burstKey, bursts, compact]);

  if (chains.length === 0) return null;

  const sourceCenter = (() => {
    const burst = bursts[0];
    if (!burst) return null;
    return (
      laneCardViewport(burst.sourceLane, burst.sourceUid) ??
      measureLaneSlotViewport(
        burst.sourceLane,
        burst.sourceSide,
        burst.sourceSlotIndex,
        compact,
      )
    );
  })();

  return (
    <AnimatePresence>
      <motion.div
        key={burstKey}
        aria-hidden
        className="dante-chain-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {sourceCenter ? (
          <motion.span
            className="dante-chain__source-spin"
            style={{ left: sourceCenter.x, top: sourceCenter.y }}
            initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
            animate={{ opacity: [0, 0.9, 0.65, 0], scale: [0.6, 1.15, 1.35, 1.5], rotate: 720 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        ) : null}

        {chains.map((chain) => {
          const delay = chain.stagger * 0.1;
          const dx = chain.x2 - chain.x1;
          const dy = chain.y2 - chain.y1;

          return (
            <motion.span
              key={chain.key}
              className="dante-chain__link"
              style={{ left: chain.x1, top: chain.y1 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{
                x: [0, chain.midX - chain.x1, dx],
                y: [0, chain.midY - chain.y1, dy],
                opacity: [0, 0.95, 0.9, 0.7, 0],
                scale: [0.5, 1, 1.05, 0.95, 0.75],
                rotate: [0, 120, 240, 360],
              }}
              transition={{
                duration: 0.72,
                delay,
                ease: [0.42, 0, 0.2, 1],
                times: [0, 0.35, 0.7, 0.88, 1],
              }}
            />
          );
        })}

        {chains.map((chain) => (
          <motion.span
            key={`hit-${chain.key}`}
            className="dante-chain__impact"
            style={{ left: chain.x2, top: chain.y2 }}
            initial={{ opacity: 0, scale: 0.45 }}
            animate={{ opacity: [0, 0, 0.9, 0.5, 0], scale: [0.45, 0.55, 1.1, 1.3, 1.5] }}
            transition={{ duration: 0.48, delay: chain.stagger * 0.1 + 0.42, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
