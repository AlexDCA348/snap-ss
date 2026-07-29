import { useEffect, useState } from 'react';

const QUERY = '(hover: none) and (pointer: coarse)';

export function matchesCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

/** Téléphone / tablette tactile — pas de drag HTML5 fiable. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(matchesCoarsePointer);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return coarse;
}
