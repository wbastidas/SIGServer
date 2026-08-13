/**
 * Detecta pantallas estrechas (movil) para adaptar la disposicion.
 *
 * Se necesita en JavaScript, y no solo en CSS, porque algunos componentes de
 * Calcite se configuran por propiedad (p. ej. si el panel lateral empuja el
 * contenido o se superpone a el).
 */
import { useEffect, useState } from 'react';

export function useIsNarrow(maxWidth = 720): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= maxWidth,
  );

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [maxWidth]);

  return narrow;
}
