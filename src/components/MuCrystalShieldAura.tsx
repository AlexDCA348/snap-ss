import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  active: boolean;
}

/** Mur de cristal de Mû — bouclier doré sur toute la lane. */
export function MuCrystalShieldAura({ active }: Props) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="mu-shield"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          aria-hidden
          className="mu-crystal-shield absolute inset-0 z-[5] overflow-hidden pointer-events-none"
        >
          <div className="mu-crystal-shield__wall" />
          <div className="mu-crystal-shield__facets" />
          <div className="mu-crystal-shield__rim" />
          <div className="mu-crystal-shield__glow" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
