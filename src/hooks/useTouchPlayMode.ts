import { matchesCoarsePointer } from './useCoarsePointer';

/** Tap-to-play / drag tactile — appareil à pointeur grossier uniquement. */
export function useTouchPlayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return matchesCoarsePointer();
}
