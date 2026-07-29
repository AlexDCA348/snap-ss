import type { DropRatesConfig, FragmentRarity } from '../types';

export const DROP_RATES: DropRatesConfig = {
  entries: [
    { rarity: 'common', weight: 70 },
    { rarity: 'rare', weight: 20 },
    { rarity: 'epic', weight: 8 },
    { rarity: 'legendary', weight: 2 },
  ],
};

export function validateDropRates(config: DropRatesConfig): void {
  const total = config.entries.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) {
    throw new Error('Drop rates must have a positive total weight.');
  }
}

export function getRarityWeights(config: DropRatesConfig): Map<FragmentRarity, number> {
  return new Map(config.entries.map((e) => [e.rarity, e.weight]));
}

validateDropRates(DROP_RATES);
