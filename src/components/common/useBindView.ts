/**
 * Hook para enlazar la instancia de MapView creada con @arcgis/core a un
 * web component de @arcgis/map-components (patron recomendado del SDK 5.x:
 * componentes, no widgets). Establece la propiedad `.view` del elemento.
 */
import { RefObject, useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';

export function useBindView(ref: RefObject<any>) {
  const view = useMapStore((s) => s.view);
  useEffect(() => {
    if (ref.current && view) {
      ref.current.view = view;
    }
  }, [ref, view]);
  return view;
}
