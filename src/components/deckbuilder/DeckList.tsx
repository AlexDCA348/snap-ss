import { getCardDef } from '../../game/cards';
import { defToPreviewInstance } from '../../game/cardPreview';
import { DECK_SIZE } from '../../game/deckPool';
import { CardView } from '../CardView';

interface Props {
  cardIds: string[];
  onRemove: (defId: string) => void;
  onInspect: (defId: string) => void;
  onAddCard: () => void;
}

/** Grille 3×4 — les 12 slots visibles d'un coup. */
export function DeckList({ cardIds, onRemove, onInspect, onAddCard }: Props) {
  const slots = Array.from({ length: DECK_SIZE }, (_, i) => cardIds[i] ?? null);

  return (
    <div className="deck-list w-full h-full min-h-0">
      <div className="deck-list__grid">
        {slots.map((defId, slotIndex) => {
          if (defId) {
            return (
              <div
                key={`${defId}-${slotIndex}`}
                className="deck-list__slot relative flex justify-center"
              >
                <CardView
                  card={defToPreviewInstance(defId)}
                  size="xs"
                  holoMode="static"
                  onClick={() => onInspect(defId)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(defId);
                  }}
                  className="deck-list__remove absolute -top-1 -right-0.5 z-20 w-5 h-5 rounded-full bg-rose-600 text-white text-xs ring-1 ring-white/30 hover:bg-rose-500 shadow-md"
                  aria-label={`Retirer ${getCardDef(defId).name}`}
                >
                  ×
                </button>
              </div>
            );
          }

          return (
            <button
              key={`empty-${slotIndex}`}
              type="button"
              onClick={onAddCard}
              disabled={cardIds.length >= DECK_SIZE}
              className="deck-list__add aspect-[52/72] w-full max-w-[3.25rem] mx-auto flex items-center justify-center rounded-xl border-2 border-dashed border-gold-400/35 bg-black/25 text-gold-300/50 text-2xl hover:border-gold-400/55 hover:bg-gold-500/10 hover:text-gold-200/80 transition disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Ajouter une carte"
            >
              +
            </button>
          );
        })}
      </div>
    </div>
  );
}
