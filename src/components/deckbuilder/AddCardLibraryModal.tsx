import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { isCardUnlockedForDeck } from '../../game/deckPool';
import { defToPreviewInstance } from '../../game/cardPreview';
import type { Faction } from '../../game/types';
import { useCollectionStore } from '../../store/collectionStore';
import { CardView } from '../CardView';
import { CardPickDetailModal } from './CardPickDetailModal';
import { useLibraryFilters } from './useLibraryFilters';

const QUICK_FACTIONS: { id: Faction | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'bronze', label: 'Bronze' },
  { id: 'gold', label: 'Or' },
  { id: 'black', label: 'Noir' },
];

interface Props {
  open: boolean;
  deckCardIds: string[];
  onClose: () => void;
  onAdd: (defId: string) => void;
}

/** Modal plein écran — bibliothèque filtrable pour ajouter une carte. */
export function AddCardLibraryModal({ open, deckCardIds, onClose, onAdd }: Props) {
  const filters = useLibraryFilters(deckCardIds);
  const collection = useCollectionStore((s) => s.collection);
  const [pickedDefId, setPickedDefId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setPickedDefId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pickedDefId) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, pickedDefId, onClose]);

  const handleAdd = (defId: string) => {
    onAdd(defId);
    setPickedDefId(null);
    if (deckCardIds.length + 1 >= 12) onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="deck-library-modal deck-modal-panel fixed inset-0 z-[60] flex flex-col"
          role="dialog"
          aria-label="Ajouter une carte"
        >
          <header className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="display-font text-sm tracking-[0.18em] text-gold-300 uppercase">
                Bibliothèque
              </h2>
              <span className="text-[10px] tabular-nums text-ui-muted">
                {filters.filtered.length} carte(s)
              </span>
            </div>

            <input
              type="search"
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-ui-muted focus:outline-none focus:ring-1 focus:ring-gold-400/45"
            />

            <div className="grid grid-cols-4 gap-1.5">
              {QUICK_FACTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => filters.setFaction(f.id)}
                  className={[
                    'py-2 rounded-lg text-[10px] uppercase tracking-wider ring-1 transition',
                    filters.faction === f.id
                      ? 'bg-gold-500/25 ring-gold-400/55 text-gold-100'
                      : 'bg-white/5 ring-white/10 text-ui-muted hover:bg-white/10',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-ui-muted text-center">
              Touchez une carte pour l&apos;agrandir
            </p>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <div className="deck-library-modal__grid grid grid-cols-4 sm:grid-cols-5 gap-2 max-w-lg mx-auto">
              {filters.filtered.map((def) => {
                const inDeck = filters.deckSet.has(def.id);
                const owned = isCardUnlockedForDeck(def.id, collection);
                const disabled = inDeck || filters.full || !owned;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => setPickedDefId(def.id)}
                    className={[
                      'deck-library-modal__slot relative rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60',
                      disabled
                        ? 'opacity-40 saturate-[0.2]'
                        : 'hover:scale-[1.04] active:scale-[0.98]',
                    ].join(' ')}
                    aria-label={owned ? def.name : `${def.name} (verrouillée)`}
                  >
                    <div className="deck-library-modal__card">
                      <CardView
                        card={defToPreviewInstance(def.id)}
                        size="sm"
                        holoMode="static"
                      />
                    </div>
                    {inDeck ? (
                      <span className="absolute inset-x-1 bottom-1 text-[8px] uppercase tracking-wider text-center rounded bg-black/70 text-cosmos-200 py-0.5 z-10">
                        Deck
                      </span>
                    ) : !owned ? (
                      <span className="absolute inset-x-1 bottom-1 text-[8px] uppercase tracking-wider text-center rounded bg-black/75 text-ui-muted py-0.5 z-10">
                        Verrouillée
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="shrink-0 p-4 border-t border-white/10 bg-[#060912]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm ring-1 ring-white/15 bg-white/5 hover:bg-white/10 text-cosmos-200"
            >
              Annuler
            </button>
          </footer>

          <CardPickDetailModal
            defId={pickedDefId}
            canAdd={
              pickedDefId !== null &&
              isCardUnlockedForDeck(pickedDefId, collection) &&
              !filters.deckSet.has(pickedDefId) &&
              !filters.full
            }
            addDisabledReason={
              pickedDefId === null
                ? null
                : filters.deckSet.has(pickedDefId)
                  ? 'Carte déjà présente dans le deck.'
                  : filters.full
                    ? 'Deck complet (12 cartes).'
                    : !isCardUnlockedForDeck(pickedDefId, collection)
                      ? 'Carte non possédée. Complétez son armure pour l’ajouter.'
                      : null
            }
            onClose={() => setPickedDefId(null)}
            onAdd={handleAdd}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
