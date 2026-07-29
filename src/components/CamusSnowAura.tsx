import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';

interface Props {
  active: boolean;
  compact?: boolean;
}

import { auraUrl } from '../game/auraAssets';

const SNOWFLAKE = auraUrl('camus/snowflake.svg');

const FLAKE_SLOTS = [
  { x: 8, delay: 0, dur: 4.2, s: 0.7, drift: 10, svg: false },
  { x: 18, delay: 0.6, dur: 5.1, s: 0.55, drift: -8, svg: true },
  { x: 28, delay: 1.1, dur: 4.8, s: 0.85, drift: 14, svg: false },
  { x: 38, delay: 0.3, dur: 5.6, s: 0.6, drift: -12, svg: false },
  { x: 48, delay: 1.8, dur: 4.5, s: 0.9, drift: 6, svg: true },
  { x: 58, delay: 0.9, dur: 5.3, s: 0.65, drift: -10, svg: false },
  { x: 68, delay: 2.2, dur: 4.9, s: 0.75, drift: 11, svg: false },
  { x: 78, delay: 1.4, dur: 5.8, s: 0.5, drift: -7, svg: true },
  { x: 88, delay: 0.2, dur: 4.4, s: 0.8, drift: 9, svg: false },
  { x: 14, delay: 2.6, dur: 5.5, s: 0.58, drift: -14, svg: false },
  { x: 42, delay: 3.1, dur: 4.7, s: 0.72, drift: 8, svg: true },
  { x: 72, delay: 3.5, dur: 5.2, s: 0.62, drift: -9, svg: false },
] as const;

const fade = { duration: 0.5 };

/** Cercueil glacé de Camus — neige sur toute la lane (sans flou sur les cartes). */
export function CamusSnowAura({ active, compact = false }: Props) {
  const flakeCount = compact ? 32 : 52;
  const dotCount = compact ? 40 : 72;

  return (
    <AnimatePresence>
      {active ? (
        <>
          <motion.div
            key="camus-snow-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            aria-hidden
            className="camus-snow camus-snow--bg absolute inset-0 z-[4] overflow-hidden pointer-events-none"
          >
            <div className="camus-snow__frost" />
            <div className="camus-snow__haze" />
            <div className="camus-snow__rim" />
          </motion.div>

          <motion.div
            key="camus-snow-flakes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            aria-hidden
            className="camus-snow camus-snow--flakes absolute inset-0 z-[12] overflow-hidden pointer-events-none"
          >
            <div className="camus-snow__grain" />
            <div className="camus-snow__sheet" aria-hidden />

            {FLAKE_SLOTS.slice(0, Math.min(flakeCount, FLAKE_SLOTS.length)).map(
              (slot, i) => (
                <span
                  key={`flake-${i}`}
                  className={
                    slot.svg
                      ? 'camus-snow__flake camus-snow__flake--svg'
                      : 'camus-snow__flake'
                  }
                  style={
                    {
                      '--flake-x': `${slot.x}%`,
                      '--flake-s': slot.s,
                      '--flake-delay': `${slot.delay}s`,
                      '--flake-dur': `${slot.dur}s`,
                      '--flake-drift': `${slot.drift}px`,
                    } as CSSProperties
                  }
                >
                  {slot.svg ? (
                    <img src={SNOWFLAKE} alt="" draggable={false} />
                  ) : null}
                </span>
              ),
            )}

            {Array.from({ length: flakeCount - FLAKE_SLOTS.length }, (_, i) => {
              const idx = i + FLAKE_SLOTS.length;
              return (
                <span
                  key={`flake-extra-${idx}`}
                  className="camus-snow__flake"
                  style={
                    {
                      '--flake-x': `${(idx * 13 + 5) % 92}%`,
                      '--flake-s': `${0.45 + (idx % 6) * 0.1}`,
                      '--flake-delay': `${(idx * 0.27) % 3.8}s`,
                      '--flake-dur': `${4.2 + (idx % 5) * 0.55}s`,
                      '--flake-drift': `${((idx % 7) - 3) * 5}px`,
                    } as CSSProperties
                  }
                />
              );
            })}

            {Array.from({ length: dotCount }, (_, i) => (
              <span
                key={`dot-${i}`}
                className="camus-snow__dot"
                style={
                  {
                    '--dot-x': `${(i * 11 + 3) % 96}%`,
                    '--dot-delay': `${(i * 0.19) % 2.8}s`,
                    '--dot-dur': `${3.4 + (i % 4) * 0.45}s`,
                    '--dot-drift': `${((i % 5) - 2) * 6}px`,
                  } as CSSProperties
                }
              />
            ))}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
