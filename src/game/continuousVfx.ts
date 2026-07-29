import type { CardInstance } from './types';

/** Effets visuels continus sur carte — désactivés quand gelée (Hyoga / Camus). */
export function isContinuousVfxActive(
  card: Pick<CardInstance, 'silenced'>,
  laneSilenced = false,
): boolean {
  return !card.silenced && !laneSilenced;
}
