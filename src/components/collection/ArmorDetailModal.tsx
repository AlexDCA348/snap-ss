import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { getFragmentLabel } from '../../collection/config/fragmentTypes';
import { getRarityLabel } from '../../collection/viewModels';
import { useCollectionStore } from '../../store/collectionStore';
import { ArmorCardPortrait } from './ArmorCardPortrait';
import { StarDustBadge } from './StarDustBadge';

interface Props {
  armorId: string | null;
  onClose: () => void;
}

export function ArmorDetailModal({ armorId, onClose }: Props) {
  const collection = useCollectionStore((s) => s.collection);
  const getArmorDetail = useCollectionStore((s) => s.getArmorDetail);
  const craftMissingFragment = useCollectionStore((s) => s.craftMissingFragment);
  const craftFeedback = useCollectionStore((s) => s.craftFeedback);
  const clearCraftFeedback = useCollectionStore((s) => s.clearCraftFeedback);

  const detail = armorId ? getArmorDetail(armorId) : null;
  const starDust = collection.starDust ?? 0;

  useEffect(() => {
    if (!armorId) clearCraftFeedback();
  }, [armorId, clearCraftFeedback]);

  useEffect(() => {
    if (!craftFeedback) return;
    const timer = window.setTimeout(() => clearCraftFeedback(), 2200);
    return () => window.clearTimeout(timer);
  }, [craftFeedback, clearCraftFeedback]);

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
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex gap-4 min-w-0">
                <ArmorCardPortrait
                  cardId={detail.unlockedCardId}
                  unlocked={detail.status === 'unlocked'}
                  size="md"
                />
                <div className="min-w-0">
                  <h2 className="display-font text-xl text-gold-300 truncate">
                    {detail.name}
                  </h2>
                  <p className="text-sm text-ui-muted mt-1">
                    {getRarityLabel(detail.rarity)} · {detail.chapterLabel}
                  </p>
                  <p className="text-sm text-cosmos-200 mt-2">
                    Carte :{' '}
                    <span className="text-cosmos-100">{detail.unlockedCardName}</span>
                  </p>
                  <p className="text-sm text-ui-muted mt-1 tabular-nums">
                    Progression : {detail.progressOwned} / {detail.progressTotal}
                  </p>
                  <p
                    className={[
                      'text-sm mt-1',
                      detail.status === 'unlocked'
                        ? 'text-emerald-300'
                        : 'text-amber-300',
                    ].join(' ')}
                  >
                    {detail.status === 'unlocked' ? 'Débloquée' : 'Verrouillée'}
                  </p>
                </div>
              </div>
              <StarDustBadge amount={starDust} compact />
            </div>

            <div className="mt-5">
              <div className="flex items-end justify-between gap-2 mb-2">
                <h3 className="text-[10px] uppercase tracking-widest text-ui-muted">
                  Fragments
                </h3>
                {detail.missingFragments.length > 0 ? (
                  <p className="text-[10px] text-ui-muted">
                    Forger : {detail.craftCost} poussière / pièce
                  </p>
                ) : null}
              </div>
              <ul className="space-y-2 text-sm">
                {detail.fragments.map((slot) => {
                  const canBuild = !slot.owned && starDust >= detail.craftCost;
                  return (
                    <li
                      key={slot.type}
                      className="flex items-center justify-between gap-3 min-h-[2.25rem]"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={
                            slot.owned ? 'text-emerald-400' : 'text-ui-muted'
                          }
                        >
                          {slot.owned ? '✔' : '□'}
                        </span>
                        <span className="truncate">{getFragmentLabel(slot.type)}</span>
                      </span>
                      {slot.owned ? (
                        <span className="text-[10px] uppercase tracking-wider text-emerald-300/80 shrink-0">
                          Possédée
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canBuild}
                          onClick={() => craftMissingFragment(slot.fragmentId)}
                          className={[
                            'shrink-0 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition',
                            canBuild
                              ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-black hover:from-amber-200 hover:to-amber-400'
                              : 'bg-white/5 text-ui-muted ring-1 ring-white/10 cursor-not-allowed',
                          ].join(' ')}
                        >
                          Construire · {detail.craftCost}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <AnimatePresence>
              {craftFeedback ? (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center text-xs text-amber-200"
                >
                  {craftFeedback}
                </motion.p>
              ) : null}
            </AnimatePresence>

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
