import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { getCardDef } from '../../game/cards';
import type { Faction } from '../../game/types';
import { canUseInteractiveHolo } from '../../hooks/useCardPointerVars';
import { CardFaceArtStack } from '../CardFaceArtStack';

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
  canAdd: boolean;
  onClose: () => void;
  onAdd: (defId: string) => void;
}

/** Modal transparente — aperçu carte + ajout au deck. */
export function CardPickDetailModal({ defId, canAdd, onClose, onAdd }: Props) {
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
        className="deck-pick-detail deck-modal-overlay fixed inset-0 z-[70] flex flex-col items-center justify-end sm:justify-center p-4 pb-6"
        role="dialog"
        aria-label={`Choisir : ${def.name}`}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="deck-pick-detail__panel deck-modal-panel w-full max-w-[min(92vw,360px)] rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
        >
          <div className="relative aspect-[3/4] w-full max-h-[48vh] mx-auto overflow-hidden card-frame--holo">
            <CardFaceArtStack
              defId={def.id}
              faction={def.faction}
              nameInitial={def.name.charAt(0)}
              holoMode={
                canUseInteractiveHolo('interactive') ? 'interactive' : 'static'
              }
            />
            <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-cosmos-500 ring-2 ring-cosmos-300 flex items-center justify-center font-bold text-lg">
              {def.cost}
            </div>
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 ring-2 ring-gold-400/70 flex items-center justify-center font-bold text-lg text-white">
              {def.power}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="display-font text-lg text-white tracking-wider">
                {def.name}
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest ${faction.tint}`}
              >
                {faction.label}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3 border-t border-white/10">
            {def.ability ? (
              <div className="rounded-lg border border-cosmos-400/25 bg-cosmos-500/10 p-3">
                <div className="text-[10px] uppercase tracking-widest text-ui-muted">
                  {def.ability.kind === 'on-reveal'
                    ? 'Au révélé'
                    : def.ability.kind === 'end-reveal'
                      ? 'Fin de révélation'
                      : def.ability.kind === 'on-destroy'
                        ? 'À la destruction'
                        : 'Continu'}
                </div>
                <p className="mt-1 text-sm text-white/95 leading-snug">
                  {def.ability.text}
                </p>
              </div>
            ) : (
              <p className="text-ui-muted italic text-sm text-center">
                Aucune capacité.
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm ring-1 ring-white/15 bg-white/5 hover:bg-white/10 text-cosmos-200"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!canAdd}
                onClick={() => {
                  onAdd(defId);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium ring-1 ring-gold-400/50 bg-gold-500/25 hover:bg-gold-500/35 text-gold-100 disabled:opacity-40 disabled:pointer-events-none"
              >
                Ajouter
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
