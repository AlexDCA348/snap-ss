export const SEIYA_DEF_ID = 'seiya';

const SEIYA_VISUAL_BASE = 2;
const SEIYA_VISUAL_CAP = 14;

/** 0 (puissance ≤ 2) → 1 (aura maximale). L’aura n’apparaît qu’au-dessus de 2. */
export function seiyaCosmosIntensity(power: number): number {
  const base = SEIYA_VISUAL_BASE;
  if (power <= base) return 0;
  const t = (power - base) / (SEIYA_VISUAL_CAP - base);
  return Math.min(1, t);
}

/**
 * Vitesse d'animation de l'aura : ~0.72 (faible) → ~2.1 (haute puissance).
 * Plus Seiya est fort, plus le cosmos pulse vite.
 */
export function seiyaCosmosAnimSpeed(power: number): number {
  const base = SEIYA_VISUAL_BASE;
  if (power <= base) return 0.72;
  const t = Math.min(1, (power - base) / (SEIYA_VISUAL_CAP - base));
  return 0.72 + t * 1.38;
}

export function isSeiyaCard(defId: string): boolean {
  return defId === SEIYA_DEF_ID;
}

/** Classes d'aura externe — ombres douces en CSS (plus floues qu'un seul box-shadow Tailwind). */
export function seiyaAuraClass(flash?: 'buff' | 'debuff'): string {
  if (flash === 'buff') return 'card-frame--seiya-buff';
  if (flash === 'debuff') return 'card-frame--seiya-debuff';
  return '';
}
