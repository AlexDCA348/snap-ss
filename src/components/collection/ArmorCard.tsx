import { motion } from 'framer-motion';
import type { ArmorViewModel } from '../../collection/viewModels';
import { getFragmentLabel } from '../../collection/config/fragmentTypes';
import { getRarityLabel } from '../../collection/viewModels';
import { ArmorCardPortrait } from './ArmorCardPortrait';

interface Props {
  armor: ArmorViewModel;
  onClick: () => void;
}

const RARITY_RING: Record<ArmorViewModel['rarity'], string> = {
  common: 'ring-white/20',
  rare: 'ring-sky-400/40',
  epic: 'ring-violet-400/50',
  legendary: 'ring-gold-400/60',
};

export function ArmorCard({ armor, onClick }: Props) {
  const unlocked = armor.status === 'unlocked';
  const statusLabel = unlocked ? 'Débloquée' : 'Verrouillée';
  const statusClass = unlocked ? 'text-emerald-300' : 'text-amber-300';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={[
        'text-left w-full rounded-xl border border-white/10 bg-black/35 p-4',
        'ring-1 transition hover:bg-black/45',
        RARITY_RING[armor.rarity],
      ].join(' ')}
    >
      <div className="flex gap-3">
        <ArmorCardPortrait
          cardId={armor.unlockedCardId}
          unlocked={unlocked}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="display-font text-sm text-cosmos-100 truncate">
            {armor.name}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-ui-muted mt-0.5">
            {getRarityLabel(armor.rarity)} · {armor.chapterLabel}
          </div>
          <div className={['text-xs mt-1', statusClass].join(' ')}>
            {statusLabel}
          </div>
          <div className="text-xs text-ui-muted mt-2 tabular-nums">
            Progression : {armor.progressOwned} / {armor.progressTotal}
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-ui-muted">
        {armor.fragments.map((slot) => (
          <li key={slot.type} className="flex items-center gap-2">
            <span className={slot.owned ? 'text-emerald-400' : 'text-ui-muted'}>
              {slot.owned ? '✔' : '□'}
            </span>
            <span className={slot.owned ? '' : 'text-ui-muted'}>
              {getFragmentLabel(slot.type)}
            </span>
          </li>
        ))}
      </ul>
    </motion.button>
  );
}
