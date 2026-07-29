import { getCardDef } from '../../game/cards';
import { CardArt } from '../CardArt';

interface Props {
  cardId: string;
  unlocked: boolean;
  size?: 'sm' | 'md';
}

const SIZE_CLASS = {
  sm: 'w-16 h-20',
  md: 'w-24 h-32',
} as const;

export function ArmorCardPortrait({ cardId, unlocked, size = 'sm' }: Props) {
  const def = getCardDef(cardId);
  const nameInitial = def.name.trim()[0]?.toUpperCase() ?? '?';

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden rounded-lg border',
        SIZE_CLASS[size],
        unlocked ? 'border-gold-400/35' : 'border-white/10',
      ].join(' ')}
      aria-hidden
    >
      <div
        className={[
          'absolute inset-0 bg-gradient-to-br from-cosmos-700/40 to-black/80',
          'transition-[filter] duration-300',
          unlocked ? '' : 'grayscale brightness-[0.5] contrast-[0.95] saturate-0',
        ].join(' ')}
      >
        <CardArt
          defId={cardId}
          faction={def.faction}
          nameInitial={nameInitial}
          continuousVfxActive={false}
        />
      </div>
      {!unlocked ? (
        <div
          className="absolute inset-0 bg-black/30 pointer-events-none"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
