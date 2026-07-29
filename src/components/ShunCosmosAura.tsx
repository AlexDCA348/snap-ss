import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  active: boolean;
  compact?: boolean;
}

/** Aura cosmos rose Andromède — brume diffuse sur le côté de lane. */
export function ShunCosmosAura({ active }: Props) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="shun-aura"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          aria-hidden
          className="shun-cosmos-aura absolute inset-0 z-0 overflow-hidden rounded-lg pointer-events-none"
        >
          <div className="shun-cosmos-aura__base" />
          <div className="shun-cosmos-aura__veil" />
          <div className="shun-cosmos-aura__core" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
