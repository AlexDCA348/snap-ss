import { useMemo, useState } from 'react';
import { DECK_SIZE, getBuildableCardDefs } from '../../game/deckPool';
import type { Faction } from '../../game/types';
import { useCollectionStore } from '../../store/collectionStore';
import type { LibrarySort } from './LibraryFilters';

export function useLibraryFilters(deckCardIds: string[]) {
  const collection = useCollectionStore((s) => s.collection);
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

  const deckSet = useMemo(() => new Set(deckCardIds), [deckCardIds]);
  const full = deckCardIds.length >= DECK_SIZE;

  return {
    search,
    setSearch,
    faction,
    setFaction,
    maxCost,
    setMaxCost,
    sort,
    setSort,
    filtered,
    deckSet,
    full,
  };
}
