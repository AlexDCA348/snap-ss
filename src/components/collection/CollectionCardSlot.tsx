import { defToPreviewInstance } from '../../game/cardPreview';
import { CardView } from '../CardView';

interface Props {
  cardId: string;
  unlocked: boolean;
}

/** Emplacement carte dans une ligne de collection. */
export function CollectionCardSlot({ cardId, unlocked }: Props) {
  return (
    <div
      className={[
        'collection-row__card flex items-center justify-center min-h-[10rem]',
        unlocked ? '' : 'collection-row__card--locked',
      ].join(' ')}
    >
      <CardView
        card={defToPreviewInstance(cardId)}
        size="md"
        holoMode="static"
        holoDisabled
        animateCardEffects={false}
      />
    </div>
  );
}
