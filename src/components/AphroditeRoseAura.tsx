import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';

interface Props {
  active: boolean;
  compact?: boolean;
}

/** Nuage de pétales rouges flous — tapis de roses d’Aphrodite. */
export function AphroditeRoseAura({ active, compact = false }: Props) {
  const particleCount = compact ? 20 : 32;

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="aphrodite-roses"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          aria-hidden
          className="aphrodite-roses absolute inset-0 z-[4] overflow-hidden pointer-events-none"
        >
          <div className="aphrodite-roses__wash" />
          <div className="aphrodite-roses__haze" />
          <div className="aphrodite-roses__grain" />

          {Array.from({ length: particleCount }, (_, i) => (
            <span
              key={i}
              className="aphrodite-roses__particle"
              style={
                {
                  '--petal-x': `${(i * 17 + 6) % 94}%`,
                  '--petal-y': `${(i * 23 + 4) % 88}%`,
                  '--petal-s': `${0.55 + (i % 7) * 0.12}`,
                  '--petal-delay': `${(i * 0.37) % 3.2}s`,
                  '--petal-dur': `${3.8 + (i % 6) * 0.65}s`,
                  '--petal-rot': `${(i * 41) % 360}deg`,
                } as CSSProperties
              }
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
