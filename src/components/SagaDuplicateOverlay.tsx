import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import { getCardArtCandidates } from '../game/cardArt';
import type { SagaDuplicateBurst } from '../game/sagaDuplicate';
import { measureLaneSlotViewport } from '../game/vfxMeasure';
import type { LocationIndex } from '../game/types';
const FLIGHT_S = 0.95;

interface Props {
  bursts: SagaDuplicateBurst[];
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
  side: SagaDuplicateBurst['side'],
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

function measureBurst(burst: SagaDuplicateBurst, compact: boolean): BurstGeom | null {
  const source =
    laneCardRect(burst.sourceLane, burst.sourceUid) ??
    slotRect(burst.sourceLane, burst.side, burst.sourceSlotIndex, compact);
  const target =
    laneCardRect(burst.targetLane, burst.illusionUid) ??
    slotRect(burst.targetLane, burst.side, burst.targetSlotIndex, compact);
  if (!source || !target) return null;

  const dx = target.cx - source.cx;
  const dy = target.cy - source.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const lift = compact ? 48 : 72;

  return {
    key: burst.sourceUid,
    source,
    target,
    midX: source.cx + dx * 0.48 + nx * (compact ? 28 : 40),
    midY: source.cy + dy * 0.38 - lift,
  };
}

const SAGA_ART = getCardArtCandidates('saga')[0] ?? '';

function CloneFace({ ghost = false }: { ghost?: boolean }) {
  return (
    <div
      className={[
        'saga-duplicate__clone',
        ghost ? 'saga-duplicate__clone--ghost' : '',
      ].join(' ')}
    >
      {SAGA_ART ? (
        <img
          src={SAGA_ART}
          alt=""
          draggable={false}
          className="saga-duplicate__clone-art"
        />
      ) : (
        <div className="saga-duplicate__clone-fallback">★</div>
      )}
      <div className="saga-duplicate__clone-frame" aria-hidden />
      <div className="saga-duplicate__clone-shimmer" aria-hidden />
    </div>
  );
}

/** Saga des Gémeaux — la carte se duplique vers un autre lieu au révélé. */
export function SagaDuplicateOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<BurstGeom[]>([]);

  const burstKey = useMemo(
    () => bursts.map((b) => `${b.sourceUid}->${b.illusionUid}`).join('|'),
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
            className="saga-duplicate-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="saga-duplicate__split-ring"
              style={{ left: shot.source.cx, top: shot.source.cy }}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: [0, 0.9, 0.5, 0], scale: [0.55, 1.2, 1.55, 1.85] }}
              transition={{ duration: 0.72, ease: 'easeOut' }}
            />
            <motion.span
              className="saga-duplicate__split-ring saga-duplicate__split-ring--mirror"
              style={{ left: shot.source.cx, top: shot.source.cy }}
              initial={{ opacity: 0, scale: 0.65, rotate: 0 }}
              animate={{ opacity: [0, 0.75, 0.35, 0], scale: [0.65, 1.05, 1.35, 1.6], rotate: 180 }}
              transition={{ duration: 0.85, delay: 0.06, ease: 'easeOut' }}
            />

            <motion.div
              className="saga-duplicate__mirror-flash"
              style={{ left: shot.source.cx, top: shot.source.cy }}
              initial={{ opacity: 0, scaleX: 1, scaleY: 1 }}
              animate={{
                opacity: [0, 0.85, 0.4, 0],
                scaleX: [1, 1.12, 1.28, 1.4],
                scaleY: [1, 0.92, 0.82, 0.75],
              }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
            />

            <motion.div
              className="saga-duplicate__flying-wrap"
              style={{
                left: shot.source.cx,
                top: shot.source.cy,
                width: shot.source.width,
                height: shot.source.height,
                marginLeft: -halfW,
                marginTop: -halfH,
              }}
              initial={{ x: 0, y: 0, scale: 0.9, opacity: 0, rotateY: 0 }}
              animate={{
                x: [0, -halfW * 0.16, shot.midX - shot.source.cx, dx],
                y: [0, -halfH * 0.12, shot.midY - shot.source.cy, dy],
                scale: [0.9, 1.05, 1.02, endScale],
                opacity: [0, 1, 1, 0.95, 0],
                rotateY: [0, -22, 10, 0],
              }}
              transition={{
                duration: FLIGHT_S,
                delay: 0.14,
                ease: [0.42, 0, 0.2, 1],
                times: [0, 0.14, 0.58, 0.88, 1],
              }}
            >
              <CloneFace />
            </motion.div>

            <motion.div
              className="saga-duplicate__ghost-wrap"
              style={{
                left: shot.source.cx,
                top: shot.source.cy,
                width: shot.source.width,
                height: shot.source.height,
                marginLeft: -halfW,
                marginTop: -halfH,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scaleX: -1 }}
              animate={{
                opacity: [0, 0.6, 0.35, 0],
                x: [0, -halfW * 0.44, -halfW * 0.72],
                scaleX: [-1, -1.1, -1.18],
              }}
              transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
            >
              <CloneFace ghost />
            </motion.div>

            <motion.span
              className="saga-duplicate__trail"
              style={{
                left: shot.source.cx,
                top: shot.source.cy,
                rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
              }}
              initial={{ opacity: 0, scaleX: 0.2 }}
              animate={{ opacity: [0, 0.75, 0.45, 0], scaleX: [0.2, 1, 1.15, 0.85] }}
              transition={{ duration: FLIGHT_S, delay: 0.2, ease: 'easeOut' }}
            />

            <motion.span
              className="saga-duplicate__impact"
              style={{ left: shot.target.cx, top: shot.target.cy }}
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{ opacity: [0, 0, 0.95, 0.55, 0], scale: [0.45, 0.55, 1.2, 1.45, 1.7] }}
              transition={{ duration: 0.7, delay: 0.14 + FLIGHT_S * 0.82, ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
