import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

export function matchesCompactUi(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

/** Petit écran (mobile + simulateur Chrome device mode). */
export function useCompactUi(): boolean {
  const [compact, setCompact] = useState(matchesCompactUi);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return compact;
}
