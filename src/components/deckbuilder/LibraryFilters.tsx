import type { Faction } from '../../game/types';

export type LibrarySort = 'cost' | 'power' | 'name';

const FACTIONS: (Faction | 'all')[] = [
  'all',
  'bronze',
  'silver',
  'gold',
  'black',
  'god',
  'neutral',
];

interface Props {
  search: string;
  faction: Faction | 'all';
  maxCost: number | 'all';
  sort: LibrarySort;
  onSearchChange: (v: string) => void;
  onFactionChange: (f: Faction | 'all') => void;
  onMaxCostChange: (c: number | 'all') => void;
  onSortChange: (s: LibrarySort) => void;
  resultCount: number;
  showResultCount?: boolean;
}

export function LibraryFilters({
  search,
  faction,
  maxCost,
  sort,
  onSearchChange,
  onFactionChange,
  onMaxCostChange,
  onSortChange,
  resultCount,
  showResultCount = true,
}: Props) {
  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher une carte..."
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-ui-muted focus:outline-none focus:ring-1 focus:ring-gold-400/50"
      />
      <div className="flex flex-wrap gap-1">
        {FACTIONS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFactionChange(f)}
            className={[
              'text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ring-1 transition',
              faction === f
                ? 'bg-gold-500/25 ring-gold-400/60 text-gold-200'
                : 'bg-white/5 ring-white/10 text-ui-muted hover:bg-white/10',
            ].join(' ')}
          >
            {f === 'all' ? 'Toutes' : f}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="text-ui-muted uppercase tracking-widest">Coût ≤</span>
        {(['all', 1, 2, 3, 4, 5, 6] as const).map((c) => (
          <button
            key={String(c)}
            type="button"
            onClick={() => onMaxCostChange(c)}
            className={[
              'px-2 py-0.5 rounded-full ring-1 transition',
              maxCost === c
                ? 'bg-cosmos-500/30 ring-cosmos-300/50 text-cosmos-100'
                : 'bg-white/5 ring-white/10 text-ui-muted',
            ].join(' ')}
          >
            {c === 'all' ? '∞' : c}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as LibrarySort)}
          className="ml-auto rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-cosmos-200"
        >
          <option value="cost">Tri : coût</option>
          <option value="power">Tri : puissance</option>
          <option value="name">Tri : nom</option>
        </select>
      </div>
      {showResultCount ? (
        <p className="text-[10px] text-ui-muted">{resultCount} carte(s)</p>
      ) : null}
    </div>
  );
}
