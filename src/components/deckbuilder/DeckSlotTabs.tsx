import { DECK_SIZE, isValidDeck } from '../../game/deckPool';
import { DECK_SLOT_COUNT, useDeckStore } from '../../store/deckStore';

export function DeckSlotTabs() {
  const slots = useDeckStore((s) => s.slots);
  const editingSlotIndex = useDeckStore((s) => s.editingSlotIndex);
  const activeSlotIndex = useDeckStore((s) => s.activeSlotIndex);
  const setEditingSlot = useDeckStore((s) => s.setEditingSlot);
  const setActiveSlot = useDeckStore((s) => s.setActiveSlot);

  return (
    <div className="deck-tabs overflow-x-auto scroll-smooth -mx-1 px-1">
      <div className="deck-tabs__track flex gap-2 min-w-min pb-1">
        {Array.from({ length: DECK_SLOT_COUNT }, (_, i) => {
          const deck = slots[i];
          const valid = isValidDeck(deck.cardIds);
          const editing = editingSlotIndex === i;
          const active = activeSlotIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setEditingSlot(i)}
              onDoubleClick={() => setActiveSlot(i)}
              className={[
                'deck-tabs__tab shrink-0 px-4 py-2.5 rounded-xl text-left ring-1 transition min-w-[108px]',
                editing
                  ? 'bg-gold-500/22 ring-gold-400/55 shadow-[0_0_16px_rgba(212,175,55,0.12)]'
                  : 'bg-black/35 ring-white/10 hover:bg-white/5',
              ].join(' ')}
              title="Double-clic : deck actif pour jouer"
            >
              <div className="flex items-center gap-1.5">
                {active ? (
                  <span className="text-gold-400 text-xs" title="Deck actif">
                    ★
                  </span>
                ) : (
                  <span className="w-3" aria-hidden />
                )}
                <span className="text-xs font-medium truncate max-w-[88px] text-cosmos-100">
                  {deck.name}
                </span>
              </div>
              <div
                className={[
                  'text-[10px] tabular-nums mt-0.5 pl-[18px]',
                  valid ? 'text-emerald-300/90' : 'text-ui-muted',
                ].join(' ')}
              >
                {deck.cardIds.length}/{DECK_SIZE}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
