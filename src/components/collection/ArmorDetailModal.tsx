import { AnimatePresence, motion } from 'framer-motion';
import type { ArmorDetailViewModel } from '../../collection/viewModels';
import { getFragmentLabel } from '../../collection/config/fragmentTypes';
import { getRarityLabel } from '../../collection/viewModels';
import { ArmorCardPortrait } from './ArmorCardPortrait';

interface Props {
  detail: ArmorDetailViewModel | null;
  onClose: () => void;
}

export function ArmorDetailModal({ detail, onClose }: Props) {
  return (
    <AnimatePresence>
      {detail ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-cosmos-950 p-6 shadow-2xl"
          >
            <div className="flex gap-4">
              <ArmorCardPortrait
                cardId={detail.unlockedCardId}
                unlocked={detail.status === 'unlocked'}
                size="md"
              />
              <div>
                <h2 className="display-font text-xl text-gold-300">{detail.name}</h2>
                <p className="text-sm text-ui-muted mt-1">
                  {getRarityLabel(detail.rarity)} · {detail.chapterLabel}
                </p>
                <p className="text-sm text-cosmos-200 mt-2">
                  Carte : <span className="text-cosmos-100">{detail.unlockedCardName}</span>
                </p>
                <p className="text-sm text-ui-muted mt-1 tabular-nums">
                  Progression : {detail.progressOwned} / {detail.progressTotal}
                </p>
                <p
                  className={[
                    'text-sm mt-1',
                    detail.status === 'unlocked' ? 'text-emerald-300' : 'text-amber-300',
                  ].join(' ')}
                >
                  {detail.status === 'unlocked' ? 'Débloquée' : 'Verrouillée'}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-[10px] uppercase tracking-widest text-ui-muted mb-2">
                Fragments
              </h3>
              <ul className="space-y-1.5 text-sm">
                {detail.fragments.map((slot) => (
                  <li key={slot.type} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className={slot.owned ? 'text-emerald-400' : 'text-ui-muted'}>
                        {slot.owned ? '✔' : '□'}
                      </span>
                      {getFragmentLabel(slot.type)}
                    </span>
                    {slot.quantity > 1 ? (
                      <span className="text-xs text-ui-muted tabular-nums">×{slot.quantity}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full py-2.5 rounded-full display-font text-sm tracking-wider bg-white/5 ring-1 ring-white/15 text-cosmos-200 hover:bg-white/10 transition"
            >
              Fermer
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
