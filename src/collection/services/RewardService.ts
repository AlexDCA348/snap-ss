import { DROP_RATES, getRarityWeights } from '../config/dropRates';
import type {
  ArmorCatalog,
  ArmorFragmentDefinition,
  DropRatesConfig,
  FragmentRarity,
  PlayerCollection,
  Reward,
} from '../types';
import { addFragment } from './ArmorCollectionService';
import { syncUnlockedChapters } from './ChapterProgressService';

function pickWeightedRarity(
  weights: Map<FragmentRarity, number>,
  rng: () => number = Math.random,
): FragmentRarity {
  const entries = [...weights.entries()].filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;

  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }

  return entries[entries.length - 1][0];
}

export function getEligibleFragments(
  catalog: ArmorCatalog,
  unlockedChapterIds: string[],
): ArmorFragmentDefinition[] {
  const unlocked = new Set(unlockedChapterIds);
  return catalog.fragments.filter((f) => unlocked.has(f.chapterId));
}

function pickFragmentFromPool(
  pool: ArmorFragmentDefinition[],
  rarity: FragmentRarity,
  rng: () => number = Math.random,
): ArmorFragmentDefinition | null {
  const byRarity = pool.filter((f) => f.rarity === rarity);
  if (byRarity.length === 0) return null;
  const index = Math.floor(rng() * byRarity.length);
  return byRarity[index] ?? null;
}

function pickFragmentWithFallback(
  pool: ArmorFragmentDefinition[],
  dropRates: DropRatesConfig,
  rng: () => number = Math.random,
): ArmorFragmentDefinition {
  if (pool.length === 0) {
    throw new Error('No eligible fragments in reward pool.');
  }

  const weights = getRarityWeights(dropRates);
  const rarityOrder = [...weights.keys()];

  const preferredRarity = pickWeightedRarity(weights, rng);
  const preferred = pickFragmentFromPool(pool, preferredRarity, rng);
  if (preferred) return preferred;

  for (const rarity of rarityOrder) {
    const fallback = pickFragmentFromPool(pool, rarity, rng);
    if (fallback) return fallback;
  }

  const index = Math.floor(rng() * pool.length);
  return pool[index]!;
}

export function grantVictoryReward(
  collection: PlayerCollection,
  catalog: ArmorCatalog,
  dropRates: DropRatesConfig = DROP_RATES,
  rng: () => number = Math.random,
): { collection: PlayerCollection; reward: Reward } {
  const pool = getEligibleFragments(catalog, collection.unlockedChapterIds);
  const fragment = pickFragmentWithFallback(pool, dropRates, rng);
  const grant = addFragment(collection, catalog, fragment.id);
  const chapterSync = syncUnlockedChapters(grant.collection, catalog);

  return {
    collection: chapterSync.collection,
    reward: {
      fragment,
      isNew: grant.isNew,
      completedArmor: grant.justCompletedArmor,
      unlockedCardId: grant.justCompletedArmor?.unlockedCardId ?? null,
      newlyUnlockedChapters: chapterSync.newlyUnlocked,
    },
  };
}
