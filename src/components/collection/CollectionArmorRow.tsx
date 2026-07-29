import { motion } from 'framer-motion';
import type { ArmorViewModel } from '../../collection/viewModels';
import { getRarityLabel } from '../../collection/viewModels';
import { ArmorIllustration } from './ArmorIllustration';
import { CollectionCardSlot } from './CollectionCardSlot';

interface Props {
  armor: ArmorViewModel;
  index: number;
  onClick: () => void;
}

/** Ligne collection — carte + armure en 2 colonnes, alternance gauche/droite. */
export function CollectionArmorRow({ armor, index, onClick }: Props) {
  const unlocked = armor.status === 'unlocked';
  const reversed = index % 2 === 1;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="collection-row w-full rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md ring-1 ring-white/5 p-3 sm:p-4 text-left transition hover:bg-black/65 hover:ring-white/15"
    >
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <div className="min-w-0">
          <div className="display-font text-sm text-cosmos-100 truncate">{armor.name}</div>
          <div className="text-[10px] uppercase tracking-widest text-ui-muted mt-0.5">
            {getRarityLabel(armor.rarity)}
          </div>
        </div>
        <div
          className={[
            'shrink-0 text-[10px] uppercase tracking-wider tabular-nums px-2 py-0.5 rounded-full ring-1',
            unlocked
              ? 'text-emerald-200 ring-emerald-400/35 bg-emerald-500/10'
              : 'text-ui-muted ring-white/10 bg-white/5',
          ].join(' ')}
        >
          {armor.progressOwned}/{armor.progressTotal}
        </div>
      </div>

      <div
        className={[
          'grid grid-cols-2 gap-3 sm:gap-4 items-center',
          reversed ? 'collection-row--reversed' : '',
        ].join(' ')}
      >
        <CollectionCardSlot cardId={armor.unlockedCardId} unlocked={unlocked} />
        <ArmorIllustration
          cardId={armor.unlockedCardId}
          unlocked={unlocked}
          name={armor.name}
          fragments={armor.fragments}
        />
      </div>
    </motion.button>
  );
}
