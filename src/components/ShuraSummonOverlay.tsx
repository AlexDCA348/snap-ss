import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import { getCardArtCandidates } from '../game/cardArt';
import type { ShuraSummonBurst } from '../game/shuraSummon';
import { measureLaneSlotViewport } from '../game/vfxMeasure';
import type { LocationIndex, PlayerId } from '../game/types';

const FLIGHT_S = 0.82;

interface Props {
  bursts: ShuraSummonBurst[];
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

function slotRect(
  lane: LocationIndex,
  side: PlayerId,
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

/** Origine « main » : main joueur, ou zone adverse en haut de l'écran. */
function handOriginRect(side: PlayerId, target: CardRect, compact: boolean): CardRect {
  const w = target.width;
  const h = target.height;

  if (side === 'player') {
    const hand = document.querySelector('.game-hand') as HTMLElement | null;
    if (hand) {
      const r = hand.getBoundingClientRect();
      return {
        left: r.left + r.width / 2 - w / 2,
        top: r.top + r.height / 2 - h / 2,
        width: w,
        height: h,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
      };
    }
    return {
      left: target.cx - w / 2,
      top: window.innerHeight - h - (compact ? 12 : 24),
      width: w,
      height: h,
      cx: target.cx,
      cy: window.innerHeight - h / 2 - (compact ? 12 : 24),
    };
  }

  // Camp adverse : part du haut de l'écran (main IA virtuelle).
  return {
    left: target.cx - w / 2,
    top: compact ? 8 : 16,
    width: w,
    height: h,
    cx: target.cx,
    cy: (compact ? 8 : 16) + h / 2,
  };
}

function measureBurst(burst: ShuraSummonBurst, compact: boolean): BurstGeom | null {
  const target = slotRect(burst.lane, burst.targetSide, burst.slotIndex, compact);
  if (!target) return null;
  const source = handOriginRect(burst.targetSide, target, compact);

  const dx = target.cx - source.cx;
  const dy = target.cy - source.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const lift = compact ? 36 : 56;

  return {
    key: `${burst.sourceUid}->${burst.targetUid}`,
    defId: burst.defId,
    source,
    target,
    midX: source.cx + dx * 0.5 + nx * (compact ? 18 : 28),
    midY: source.cy + dy * 0.45 - lift,
  };
}

function FlyingCard({ defId }: { defId: string }) {
  const art = getCardArtCandidates(defId)[0] ?? '';
  return (
    <div className="shura-summon__card">
      {art ? (
        <img
          src={art}
          alt=""
          draggable={false}
          className="shura-summon__card-art"
        />
      ) : (
        <div className="shura-summon__card-fallback">★</div>
      )}
      <div className="shura-summon__card-frame" aria-hidden />
      <div className="shura-summon__card-glow" aria-hidden />
    </div>
  );
}

/** Shura — la carte tirée du deck adverse glisse depuis la main vers le lieu. */
export function ShuraSummonOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<BurstGeom[]>([]);

  const burstKey = useMemo(
    () =>
      bursts
        .map((b) => `${b.sourceUid}:${b.targetUid}@${b.lane}`)
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
    const timers = [48, 120, 240, 400].map((ms) => window.setTimeout(run, ms));
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
            className="shura-summon-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="shura-summon__ripple"
              style={{ left: shot.source.cx, top: shot.source.cy }}
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{ opacity: [0, 0.8, 0.35, 0], scale: [0.45, 1.1, 1.4, 1.65] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            <motion.div
              className="shura-summon__flying-wrap"
              style={{
                width: shot.source.width,
                height: shot.source.height,
                marginLeft: -halfW,
                marginTop: -halfH,
              }}
              initial={{
                x: shot.source.cx,
                y: shot.source.cy,
                scale: 0.86,
                rotate: shot.source.cy < shot.target.cy ? -10 : 10,
                opacity: 0.2,
              }}
              animate={{
                x: [shot.source.cx, shot.midX, shot.target.cx],
                y: [shot.source.cy, shot.midY, shot.target.cy],
                scale: [0.86, 1.08, endScale],
                rotate: [shot.source.cy < shot.target.cy ? -10 : 10, 0, 0],
                opacity: [0.25, 1, 1],
              }}
              transition={{ duration: FLIGHT_S, ease: 'easeInOut' }}
            >
              <FlyingCard defId={shot.defId} />
            </motion.div>

            <motion.span
              className="shura-summon__splash"
              style={{ left: shot.target.cx, top: shot.target.cy }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0, 0.9, 0], scale: [0.4, 0.4, 1.2, 1.55] }}
              transition={{ duration: FLIGHT_S, times: [0, 0.72, 0.86, 1], ease: 'easeOut' }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
