import { useEffect, useState } from 'react';

/** Suscripción a una media query de CSS (client-side). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Mobile-first: true por debajo del breakpoint md (768px) de Tailwind. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
