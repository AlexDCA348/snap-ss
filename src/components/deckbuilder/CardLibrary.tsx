import { useMemo, useState } from 'react';
import { getBuildableCardDefs, isCardUnlockedForDeck } from '../../game/deckPool';
import { defToPreviewInstance } from '../../game/cardPreview';
import type { Faction } from '../../game/types';
import { useCollectionStore } from '../../store/collectionStore';
import { CardView } from '../CardView';
import { LibraryFilters, type LibrarySort } from './LibraryFilters';

function activeFilterSummary(
  search: string,
  faction: Faction | 'all',
  maxCost: number | 'all',
  sort: LibrarySort,
): string {
  const parts: string[] = [];
  if (search.trim()) parts.push(`« ${search.trim()} »`);
  if (faction !== 'all') parts.push(faction);
  if (maxCost !== 'all') parts.push(`coût ≤ ${maxCost}`);
  if (sort !== 'cost') {
    parts.push(sort === 'power' ? 'tri pwr' : 'tri nom');
  }
  return parts.length > 0 ? parts.join(' · ') : 'Aucun filtre';
}

interface Props {
  deckCardIds: string[];
  onAdd: (defId: string) => void;
  onInspect: (defId: string) => void;
}

export function CardLibrary({ deckCardIds, onAdd, onInspect }: Props) {
  const collection = useCollectionStore((s) => s.collection);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [faction, setFaction] = useState<Faction | 'all'>('all');
  const [maxCost, setMaxCost] = useState<number | 'all'>('all');
  const [sort, setSort] = useState<LibrarySort>('cost');

  const filtered = useMemo(() => {
    let list = getBuildableCardDefs();
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      );
    }
    if (faction !== 'all') {
      list = list.filter((c) => c.faction === faction);
    }
    if (maxCost !== 'all') {
      list = list.filter((c) => c.cost <= maxCost);
    }
    list = [...list].sort((a, b) => {
      if (sort === 'cost') return a.cost - b.cost || a.power - b.power;
      if (sort === 'power') return b.power - a.power || a.cost - b.cost;
      return a.name.localeCompare(b.name, 'fr');
    });
    return list;
  }, [search, faction, maxCost, sort, collection]);

  const deckSet = new Set(deckCardIds);
  const full = deckCardIds.length >= 12;
  const filterSummary = activeFilterSummary(search, faction, maxCost, sort);
  const hasActiveFilters =
    search.trim() !== '' ||
    faction !== 'all' ||
    maxCost !== 'all' ||
    sort !== 'cost';

  return (
    <div className="flex flex-col gap-3 min-h-0 w-full">
      <div className="w-full rounded-xl border border-white/10 bg-black/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition"
        >
          <span
            className={[
              'shrink-0 text-ui-muted transition-transform duration-200',
              filtersOpen ? 'rotate-90' : '',
            ].join(' ')}
            aria-hidden
          >
            ▶
          </span>
          <span className="text-[10px] uppercase tracking-widest text-cosmos-200 font-semibold">
            Filtres
          </span>
          <span className="text-[10px] text-ui-muted truncate flex-1 min-w-0">
            {filterSummary}
          </span>
          <span className="shrink-0 text-[10px] text-gold-300/90 tabular-nums">
            {filtered.length} carte(s)
          </span>
        </button>

        <div
          className={[
            'grid transition-[grid-template-rows] duration-200 ease-out',
            filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          ].join(' ')}
        >
          <div className="overflow-hidden min-h-0">
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <LibraryFilters
                search={search}
                faction={faction}
                maxCost={maxCost}
                sort={sort}
                onSearchChange={setSearch}
                onFactionChange={setFaction}
                onMaxCostChange={setMaxCost}
                onSortChange={setSort}
                resultCount={filtered.length}
                showResultCount={false}
              />
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFaction('all');
                    setMaxCost('all');
                    setSort('cost');
                  }}
                  className="mt-2 text-[10px] uppercase tracking-wider text-ui-muted hover:text-cosmos-100"
                >
                  Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 w-full">
        <div className="grid grid-cols-6 gap-2 w-full">
          {filtered.map((def) => {
            const inDeck = deckSet.has(def.id);
            const owned = isCardUnlockedForDeck(def.id, collection);
            const disabled = inDeck || full || !owned;
            return (
              <div
                key={def.id}
                className={[
                  'relative flex justify-center transition',
                  disabled ? 'opacity-45 saturate-[0.2]' : 'hover:scale-[1.03]',
                ].join(' ')}
              >
                <CardView
                  card={defToPreviewInstance(def.id)}
                  size="sm"
                  holoMode="static"
                  onClick={() => {
                    if (inDeck) onInspect(def.id);
                    else if (owned && !full) onAdd(def.id);
                    else onInspect(def.id);
                  }}
                />
                {!owned ? (
                  <span className="absolute inset-x-1 bottom-1 text-[8px] uppercase tracking-wider text-center rounded bg-black/75 text-ui-muted py-0.5">
                    Verrouillée
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
