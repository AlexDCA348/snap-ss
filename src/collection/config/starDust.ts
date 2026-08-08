import type { ChapterId } from '../types';

/** Coût de base (Bronze / Noirs). */
export const STAR_DUST_CRAFT_COST = 20;

/** Coût pour les armures d'Argent. */
export const STAR_DUST_CRAFT_COST_SILVER = 40;

/** Coût pour les armures d'Or. */
export const STAR_DUST_CRAFT_COST_GOLD = 80;

/** Quantité gagnée quand un fragment déjà possédé tombe en récompense. */
export const STAR_DUST_FROM_DUPLICATE = 1;

const CRAFT_COST_BY_CHAPTER: Partial<Record<ChapterId, number>> = {
  'galaxian-wars': STAR_DUST_CRAFT_COST,
  'black-saints': STAR_DUST_CRAFT_COST,
  'silver-saints': STAR_DUST_CRAFT_COST_SILVER,
  sanctuary: STAR_DUST_CRAFT_COST_GOLD,
  poseidon: STAR_DUST_CRAFT_COST_GOLD,
  hades: STAR_DUST_CRAFT_COST_GOLD,
};

/** Coût de forge d'une pièce selon le chapitre de l'armure. */
export function getStarDustCraftCost(chapterId: ChapterId): number {
  return CRAFT_COST_BY_CHAPTER[chapterId] ?? STAR_DUST_CRAFT_COST;
}
