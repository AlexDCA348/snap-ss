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

/** Grille responsive 12 slots — cartes fluides qui remplissent chaque cellule. */
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
                className="deck-list__slot relative"
              >
                <div className="deck-list__card-shell relative">
                  <CardView
                    card={defToPreviewInstance(defId)}
                    size="sm"
                    holoMode="static"
                    onClick={() => onInspect(defId)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(defId);
                    }}
                    className="deck-list__remove absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-rose-600 text-white text-xs ring-1 ring-white/30 hover:bg-rose-500 shadow-md"
                    aria-label={`Retirer ${getCardDef(defId).name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={`empty-${slotIndex}`} className="deck-list__slot">
              <button
                type="button"
                onClick={onAddCard}
                disabled={cardIds.length >= DECK_SIZE}
                className="deck-list__add"
                aria-label="Ajouter une carte"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
