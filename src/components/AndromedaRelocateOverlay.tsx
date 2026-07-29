import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import { getCardArtCandidates } from '../game/cardArt';
import type { AndromedaRelocateBurst } from '../game/andromedaRelocate';
import { measureLaneSlotViewport } from '../game/vfxMeasure';
import type { LocationIndex } from '../game/types';

const FLIGHT_S = 0.88;

interface Props {
  bursts: AndromedaRelocateBurst[];
  compact?: boolean;
}

interface CardRect {
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

interface BurstGeom {
  key: string;
  defId: string;
  source: CardRect;
  target: CardRect;
  midX: number;
  midY: number;
}

function laneCardRect(lane: LocationIndex, uid: string): CardRect | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (!laneEl) return null;

  const card = laneEl.querySelector(
    `[data-lane-card="${uid}"]`,
  ) as HTMLElement | null;
  if (!card) return null;

  const r = card.getBoundingClientRect();
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

function slotRect(
  lane: LocationIndex,
  side: AndromedaRelocateBurst['side'],
  slotIndex: number,
  compact: boolean,
): CardRect | null {
  const center = measureLaneSlotViewport(lane, side, slotIndex, compact);
  if (!center) return null;

  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  const sample = laneEl?.querySelector('[data-lane-card]') as HTMLElement | null;
  const w = sample?.getBoundingClientRect().width ?? (compact ? 52 : 64);
  const h = sample?.getBoundingClientRect().height ?? (compact ? 72 : 88);

  return {
    left: center.x - w / 2,
    top: center.y - h / 2,
    width: w,
    height: h,
    cx: center.x,
    cy: center.y,
  };
}

function measureBurst(burst: AndromedaRelocateBurst, compact: boolean): BurstGeom | null {
  const source =
    laneCardRect(burst.sourceLane, burst.sourceUid) ??
    slotRect(burst.sourceLane, burst.side, burst.sourceSlotIndex, compact);
  const target = slotRect(burst.targetLane, burst.side, burst.targetSlotIndex, compact);
  if (!source || !target) return null;

  const dx = target.cx - source.cx;
  const dy = target.cy - source.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const lift = compact ? 44 : 68;

  return {
    key: burst.sourceUid,
    defId: burst.defId,
    source,
    target,
    midX: source.cx + dx * 0.5 + nx * (compact ? 24 : 36),
    midY: source.cy + dy * 0.42 - lift,
  };
}

function FlyingCard({ defId }: { defId: string }) {
  const art = getCardArtCandidates(defId)[0] ?? '';
  return (
    <div className="andromeda-relocate__card">
      {art ? (
        <img
          src={art}
          alt=""
          draggable={false}
          className="andromeda-relocate__card-art"
        />
      ) : (
        <div className="andromeda-relocate__card-fallback">★</div>
      )}
      <div className="andromeda-relocate__card-frame" aria-hidden />
      <div className="andromeda-relocate__card-glow" aria-hidden />
    </div>
  );
}

/** Île d'Andromède — la carte révélée glisse vers un autre lieu. */
export function AndromedaRelocateOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<BurstGeom[]>([]);

  const burstKey = useMemo(
    () =>
      bursts
        .map((b) => `${b.sourceUid}:${b.sourceLane}->${b.targetLane}`)
        .join('|'),
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
        .map((burst) => measureBurst(burst, compact))
        .filter((g): g is BurstGeom => g !== null);
      if (next.length > 0) setShots(next);
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

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => {
        const dx = shot.target.cx - shot.source.cx;
        const dy = shot.target.cy - shot.source.cy;
        const endScale = Math.min(
          shot.target.width / shot.source.width,
          shot.target.height / shot.source.height,
        );
        const halfW = shot.source.width / 2;
        const halfH = shot.source.height / 2;

        return (
          <motion.div
            key={shot.key}
            aria-hidden
            className="andromeda-relocate-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="andromeda-relocate__ripple"
              style={{ left: shot.source.cx, top: shot.source.cy }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.85, 0.4, 0], scale: [0.5, 1.15, 1.45, 1.7] }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />

            <motion.span
              className="andromeda-relocate__trail"
              style={{
                left: shot.source.cx,
                top: shot.source.cy,
                rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
              }}
              initial={{ opacity: 0, scaleX: 0.15 }}
              animate={{ opacity: [0, 0.7, 0.35, 0], scaleX: [0.15, 1, 1.1, 0.8] }}
              transition={{ duration: FLIGHT_S, delay: 0.18, ease: 'easeOut' }}
            />

            <motion.div
              className="andromeda-relocate__flying-wrap"
              style={{
                left: shot.source.cx,
                top: shot.source.cy,
                width: shot.source.width,
                height: shot.source.height,
                marginLeft: -halfW,
                marginTop: -halfH,
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 0, rotate: 0 }}
              animate={{
                x: [0, shot.midX - shot.source.cx, dx],
                y: [0, shot.midY - shot.source.cy, dy],
                scale: [1, 1.06, endScale],
                opacity: [0, 1, 1, 0.92, 0],
                rotate: [0, -4, 3, 0],
              }}
              transition={{
                duration: FLIGHT_S,
                delay: 0.12,
                ease: [0.42, 0, 0.2, 1],
                times: [0, 0.22, 0.62, 0.9, 1],
              }}
            >
              <FlyingCard defId={shot.defId} />
            </motion.div>

            <motion.span
              className="andromeda-relocate__splash"
              style={{ left: shot.target.cx, top: shot.target.cy }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0, 0.9, 0.5, 0], scale: [0.4, 0.5, 1.15, 1.4, 1.65] }}
              transition={{ duration: 0.65, delay: 0.12 + FLIGHT_S * 0.78, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
