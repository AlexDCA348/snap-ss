import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px) and (max-height: 700px)';

export function matchesMiniPhone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

/** iPhone mini / SE — hauteur très limitée. */
export function useMiniPhone(): boolean {
  const [mini, setMini] = useState(matchesMiniPhone);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setMini(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return mini;
}
