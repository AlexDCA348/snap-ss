import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState, type CSSProperties } from 'react';
import type { AthenaRippleSource } from '../game/athenaWave';

interface Props {
  sources: AthenaRippleSource[];
  /** Mobile : moins d’anneaux, même esthétique dorée. */
  compact?: boolean;
}

interface RippleCenter {
  uid: string;
  x: number;
  y: number;
  maxScale: number;
}

const RING_COUNT_DESKTOP = 3;
const RING_COUNT_COMPACT = 1;
const RING_BASE_PX = 52;
const RING_STAGGER_S = 2.8;

function gameReachBounds(): DOMRect {
  const main = document.querySelector('main');
  if (main) return main.getBoundingClientRect();
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

function rippleMaxScale(x: number, y: number, bounds: DOMRect): number {
  const reachX = Math.max(x - bounds.left, bounds.right - x);
  const reachY = Math.max(y - bounds.top, bounds.bottom - y);
  const reach = Math.max(reachX, reachY * 0.9);
  return (reach * 2.2) / RING_BASE_PX;
}

function measureSources(sources: AthenaRippleSource[]): RippleCenter[] {
  const bounds = gameReachBounds();

  return sources
    .map((source) => {
      const el = document.querySelector(
        `[data-lane-card="${source.uid}"]`,
      ) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      return {
        uid: source.uid,
        x,
        y,
        maxScale: rippleMaxScale(x, y, bounds),
      };
    })
    .filter((c): c is RippleCenter => c !== null);
}

/** Ripples dorés qui partent de la carte Athéna et se propagent en continu. */
export function AthenaRippleOverlay({ sources, compact = false }: Props) {
  const [centers, setCenters] = useState<RippleCenter[]>([]);
  const ringCount = compact ? RING_COUNT_COMPACT : RING_COUNT_DESKTOP;
  const sourceKey = useMemo(
    () => sources.map((s) => s.uid).join('|'),
    [sources],
  );

  useLayoutEffect(() => {
    if (sources.length === 0) {
      setCenters([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setCenters(measureSources(sources));
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
  }, [sourceKey, sources]);

  if (centers.length === 0) return null;

  return (
    <AnimatePresence>
      {centers.map((center) => (
        <motion.div
          key={center.uid}
          aria-hidden
          className="athena-ripple-source fixed z-[12] pointer-events-none"
          style={
            {
              left: center.x,
              top: center.y,
              '--ripple-max-scale': center.maxScale,
            } as CSSProperties
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          exit={{ opacity: 0 }}
        >
          <span
            className={[
              'athena-ripple__core',
              compact ? 'athena-ripple__core--lite' : '',
            ].join(' ')}
          />
          {Array.from({ length: ringCount }, (_, i) => (
            <span
              key={i}
              className={[
                'athena-ripple__ring',
                compact ? 'athena-ripple__ring--lite' : '',
              ].join(' ')}
              style={{ animationDelay: `${i * RING_STAGGER_S}s` }}
            />
          ))}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
