import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { BlackAndromedaVineSource } from '../game/blackAndromedaVines';
import type { LocationIndex, PlayerId } from '../game/types';

interface Props {
  sources: BlackAndromedaVineSource[];
  compact?: boolean;
}

interface VineGeom {
  key: string;
  d: string;
  tipX: number;
  tipY: number;
}

function measureCardCenter(uid: string): { x: number; y: number } | null {
  const el = document.querySelector(
    `[data-lane-card="${uid}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function measureLaneAnchor(
  lane: LocationIndex,
  side: PlayerId,
): { x: number; y: number } | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (!laneEl) return null;
  const zone = laneEl.querySelector(
    `[data-lane-zone="${side}"]`,
  ) as HTMLElement | null;
  const target = zone ?? laneEl;
  const r = target.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  // Ancre vers le centre de la zone du propriétaire (là où le +3 s’applique).
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height * (side === 'player' ? 0.42 : 0.58),
  };
}

function curvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lift: number,
  sideBias: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const c1x = x1 + dx * 0.28 + nx * (lift * 0.55) + sideBias;
  const c1y = y1 + dy * 0.2 - Math.abs(lift) * 0.35;
  const c2x = x1 + dx * 0.72 + nx * lift * 0.85 + sideBias * 0.4;
  const c2y = y1 + dy * 0.75 - Math.abs(lift) * 0.15;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

function measureVines(
  sources: BlackAndromedaVineSource[],
  compact: boolean,
): VineGeom[] {
  const lift = compact ? 28 : 44;
  const out: VineGeom[] = [];

  for (const source of sources) {
    const from = measureCardCenter(source.uid);
    if (!from) continue;

    source.targets.forEach((targetLane, i) => {
      const to = measureLaneAnchor(targetLane, source.side);
      if (!to) return;
      const dir = targetLane < source.lane ? -1 : 1;
      const sideBias = dir * (compact ? 10 : 16) * (i % 2 === 0 ? 1 : 0.65);
      out.push({
        key: `${source.uid}->${targetLane}`,
        d: curvedPath(from.x, from.y, to.x, to.y, lift, sideBias),
        tipX: to.x,
        tipY: to.y,
      });
    });
  }

  return out;
}

/** Lianes courbes persistantes — Andromède Noir révélé uniquement. */
export function BlackAndromedaVineOverlay({
  sources,
  compact = false,
}: Props) {
  const [vines, setVines] = useState<VineGeom[]>([]);
  const sourceKey = useMemo(
    () =>
      sources
        .map((s) => `${s.uid}:${s.lane}:${s.targets.join(',')}`)
        .join('|'),
    [sources],
  );

  useLayoutEffect(() => {
    if (sources.length === 0) {
      setVines([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = measureVines(sources, compact);
      if (next.length > 0) setVines(next);
      else setVines([]);
    };

    run();
    const raf = requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    const timer = window.setTimeout(run, 48);
    window.addEventListener('resize', run);
    window.addEventListener('scroll', run, true);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('resize', run);
      window.removeEventListener('scroll', run, true);
    };
  }, [sourceKey, sources, compact]);

  if (vines.length === 0) return null;

  const stroke = compact ? 2.2 : 2.8;

  return (
    <AnimatePresence>
      <motion.div
        key={sourceKey}
        aria-hidden
        className="black-andromeda-vines fixed inset-0 z-[13] pointer-events-none overflow-visible"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          {vines.map((vine) => (
            <g key={vine.key}>
              <motion.path
                className="black-andromeda-vines__glow"
                d={vine.d}
                fill="none"
                strokeWidth={stroke + 3}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: compact ? 0.35 : 0.45 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
              <motion.path
                className="black-andromeda-vines__stem"
                d={vine.d}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </g>
          ))}
        </svg>
        {vines.map((vine) => (
          <span
            key={`tip-${vine.key}`}
            className="black-andromeda-vines__tip"
            style={{ left: vine.tipX, top: vine.tipY }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
