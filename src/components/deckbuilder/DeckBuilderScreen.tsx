import { useState } from 'react';
import { validateDeck } from '../../game/deckPool';
import { useAppStore } from '../../store/appStore';
import { useDeckStore } from '../../store/deckStore';
import { NavButton } from '../menu/NavButton';
import { AddCardLibraryModal } from './AddCardLibraryModal';
import { CardDetailByDefId } from './CardDetailByDefId';
import { DeckList } from './DeckList';
import { DeckSlotTabs } from './DeckSlotTabs';
import { DeckToolbar } from './DeckToolbar';

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActiveDeckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DeckBuilderScreen() {
  const goToMenu = useAppStore((s) => s.goToMenu);
  const showToast = useAppStore((s) => s.showToast);
  const editingDeck = useDeckStore((s) => s.getEditingDeck());
  const renameDeck = useDeckStore((s) => s.renameDeck);
  const addCard = useDeckStore((s) => s.addCard);
  const removeCard = useDeckStore((s) => s.removeCard);
  const clearDeck = useDeckStore((s) => s.clearDeck);
  const fillRandom = useDeckStore((s) => s.fillRandom);
  const fillPreset = useDeckStore((s) => s.fillPreset);
  const setActiveSlot = useDeckStore((s) => s.setActiveSlot);
  const editingSlotIndex = useDeckStore((s) => s.editingSlotIndex);
  const activeSlotIndex = useDeckStore((s) => s.activeSlotIndex);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [inspectedDefId, setInspectedDefId] = useState<string | null>(null);
  const validation = validateDeck(editingDeck.cardIds);

  const handleAdd = (defId: string) => {
    const ok = addCard(defId);
    if (!ok) {
      showToast('Deck plein ou carte déjà présente.');
    }
  };

  const openLibrary = () => {
    if (editingDeck.cardIds.length >= 12) {
      showToast('Deck complet (12 cartes).');
      return;
    }
    setLibraryOpen(true);
  };

  return (
    <div className="deck-builder fixed inset-0 flex flex-col bg-gradient-to-b from-shadow-900 via-cosmos-900/95 to-shadow-950">
      <header className="deck-builder__header shrink-0 px-4 pt-4 pb-1">
        <h1 className="display-font text-base sm:text-lg text-gold-400 tracking-[0.16em] uppercase">
          Deck Builder
        </h1>
      </header>

      <div className="deck-builder__tabs shrink-0 px-4 pb-2">
        <DeckSlotTabs />
      </div>

      <DeckToolbar
        deckName={editingDeck.name}
        onRename={renameDeck}
        onFillRandom={fillRandom}
        onClear={clearDeck}
        onApplyPreset={(preset) => {
          const ok = fillPreset(preset.id);
          if (ok) {
            showToast(`Deck « ${preset.name} » généré.`);
          } else {
            showToast('Impossible de générer ce preset.');
          }
        }}
      />

      <main className="deck-builder__main flex-1 min-h-0 flex flex-col px-4 pb-3 safe-area-pb">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] uppercase tracking-widest text-ui-muted">
            Votre deck · {editingDeck.cardIds.length}/12
          </p>
          {!validation.ok ? (
            <p className="text-[10px] text-amber-300/90 truncate max-w-[55%]">
              {validation.reason}
            </p>
          ) : (
            <p className="text-[10px] text-emerald-300/90">Prêt</p>
          )}
        </div>

        <div className="deck-builder__cards flex-1 min-h-0 flex flex-col py-2 overflow-hidden">
          <DeckList
            cardIds={editingDeck.cardIds}
            onRemove={removeCard}
            onInspect={setInspectedDefId}
            onAddCard={openLibrary}
          />

          {editingDeck.cardIds.length < 12 ? (
            <button
              type="button"
              onClick={openLibrary}
              className="mt-3 mx-auto flex items-center gap-2 px-5 py-2 rounded-full text-xs ring-1 ring-gold-400/45 bg-gold-500/15 text-gold-100 hover:bg-gold-500/25 transition shrink-0"
            >
              <span className="text-base leading-none">+</span>
              Ajouter une carte
            </button>
          ) : null}
        </div>

        <div className="deck-builder__actions shrink-0 flex items-end justify-center gap-10 sm:gap-16 pt-4 pb-1">
          <NavButton
            label="Retour"
            icon={<BackIcon />}
            onClick={goToMenu}
          />
          <NavButton
            label={activeSlotIndex === editingSlotIndex ? 'Actif' : 'Save'}
            icon={<ActiveDeckIcon />}
            primary
            disabled={activeSlotIndex === editingSlotIndex}
            onClick={() => {
              setActiveSlot(editingSlotIndex);
              showToast(`Deck « ${editingDeck.name} » enregistré comme actif.`);
            }}
          />
        </div>
      </main>

      <AddCardLibraryModal
        open={libraryOpen}
        deckCardIds={editingDeck.cardIds}
        onClose={() => setLibraryOpen(false)}
        onAdd={handleAdd}
      />

      <CardDetailByDefId
        defId={inspectedDefId}
        onClose={() => setInspectedDefId(null)}
      />
    </div>
  );
}
