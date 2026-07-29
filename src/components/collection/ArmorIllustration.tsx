import { getCardDef } from '../../game/cards';
import type { FragmentSlotViewModel } from '../../collection/viewModels';
import { CardArt } from '../CardArt';
import { ArmorFragmentDonut } from './ArmorFragmentDonut';

interface Props {
  cardId: string;
  unlocked: boolean;
  name: string;
  fragments: FragmentSlotViewModel[];
}

/** Illustration circulaire de l'armure + donut de fragments. */
export function ArmorIllustration({ cardId, unlocked, name, fragments }: Props) {
  const def = getCardDef(cardId);
  const nameInitial = def.name.trim()[0]?.toUpperCase() ?? '?';

  return (
    <div className="collection-row__armor-wrap relative mx-auto w-full max-w-[11rem] aspect-square">
      <ArmorFragmentDonut fragments={fragments} faction={def.faction} />

      <div
        className={[
          'collection-row__armor absolute inset-[13%] rounded-full overflow-hidden',
          'ring-1 ring-white/10 shadow-[inset_0_0_24px_rgba(0,0,0,0.55)]',
        ].join(' ')}
        aria-hidden
      >
        <div
          className={[
            'absolute inset-0 bg-gradient-to-b from-cosmos-600/30 to-black/90',
            unlocked ? '' : 'grayscale brightness-[0.55] saturate-0',
          ].join(' ')}
        >
          <CardArt
            defId={cardId}
            faction={def.faction}
            nameInitial={nameInitial}
            continuousVfxActive={false}
            className="scale-[1.35] origin-top"
          />
        </div>
        {!unlocked ? (
          <div className="absolute inset-0 bg-black/35 pointer-events-none" aria-hidden />
        ) : null}
      </div>

      <span className="sr-only">{name}</span>
    </div>
  );
}
