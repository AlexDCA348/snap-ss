import { CARDS, isTokenCard } from './cards';
import type { CardDefinition } from './types';

const BANNED_IDS = new Set(['hades', 'poseidon', 'silver-saint']);
const EXCLUDED_FACTIONS = new Set(['marina', 'asgard', 'specter']);

export function isBuildableCard(def: CardDefinition): boolean {
  return (
    def.cost > 0 &&
    !BANNED_IDS.has(def.id) &&
    !EXCLUDED_FACTIONS.has(def.faction) &&
    !isTokenCard(def.id)
  );
}

export function getBuildableCardDefs(): CardDefinition[] {
  return CARDS.filter(isBuildableCard);
}

export function getBuildableCardIds(): string[] {
  return getBuildableCardDefs().map((c) => c.id);
}
