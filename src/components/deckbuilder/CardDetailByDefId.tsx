import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { getCardDef } from '../../game/cards';
import type { Faction } from '../../game/types';
import { CardFaceArtStack } from '../CardFaceArtStack';
import { canUseInteractiveHolo } from '../../hooks/useCardPointerVars';

const FACTION_LABEL: Record<Faction, { label: string; tint: string }> = {
  bronze: { label: 'Bronze', tint: 'text-bronze-400 border-bronze-400/60' },
  black: { label: 'Noir', tint: 'text-sky-200 border-sky-300/50' },
  silver: { label: 'Argent', tint: 'text-steel-400 border-steel-400/60' },
  gold: { label: 'Or', tint: 'text-gold-400 border-gold-400/60' },
  specter: { label: 'Spectre', tint: 'text-fuchsia-300 border-fuchsia-400/60' },
  marina: { label: 'Marina', tint: 'text-cyan-300 border-cyan-400/60' },
  asgard: { label: 'Asgard', tint: 'text-sky-200 border-sky-300/60' },
  god: { label: 'Divin', tint: 'text-rose-200 border-rose-300/60' },
  neutral: { label: 'Neutre', tint: 'text-white/70 border-white/20' },
};

interface Props {
  defId: string | null;
  onClose: () => void;
}

export function CardDetailByDefId({ defId, onClose }: Props) {
  useEffect(() => {
    if (!defId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [defId, onClose]);

  if (!defId) return null;
  const def = getCardDef(defId);
  const faction = FACTION_LABEL[def.faction];

  return (
    <AnimatePresence>
      <motion.div
        key={defId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="deck-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-label={`Détail : ${def.name}`}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 10, opacity: 0 }}
          className="deck-modal-panel relative w-[min(92vw,380px)] rounded-2xl border border-white/15 overflow-hidden"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden card-frame--holo">
            <CardFaceArtStack
              defId={def.id}
              faction={def.faction}
              nameInitial={def.name.charAt(0)}
              holoMode={
                canUseInteractiveHolo('interactive') ? 'interactive' : 'static'
              }
            />
            <div className="absolute top-3 left-3 w-11 h-11 rounded-full bg-cosmos-500 ring-2 ring-cosmos-300 flex items-center justify-center font-bold text-xl">
              {def.cost}
            </div>
            <div className="absolute top-3 right-3 w-11 h-11 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 ring-2 ring-gold-400/70 flex items-center justify-center font-bold text-xl text-white">
              {def.power}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="display-font text-xl text-white tracking-wider">
                {def.name}
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest ${faction.tint}`}
              >
                {faction.label}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {def.ability ? (
              <div className="rounded-lg border border-cosmos-400/30 bg-cosmos-500/10 p-3">
                <div className="text-[10px] uppercase tracking-widest text-ui-muted">
                  {def.ability.kind === 'on-reveal'
                    ? 'Au révélé'
                    : def.ability.kind === 'end-reveal'
                      ? 'Fin de révélation'
                      : def.ability.kind === 'on-destroy'
                        ? 'À la destruction'
                        : 'Continu'}
                </div>
                <p className="mt-1 text-sm text-white leading-snug">
                  {def.ability.text}
                </p>
              </div>
            ) : (
              <p className="text-ui-muted italic text-sm">Aucune capacité.</p>
            )}
            {def.flavor ? (
              <p className="text-xs italic text-ui-muted border-l-2 border-gold-400/50 pl-3">
                "{def.flavor}"
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Fermer"
          >
            ×
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
