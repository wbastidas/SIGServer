/**
 * Marcador de Street View en el mapa (el "muneco").
 *
 * Indica en el geovisor el punto que se esta viendo en Street View, de modo que
 * exista relacion visual entre ambos. Aparece al abrir Street View, se mueve al
 * elegir otro punto y desaparece al cerrarlo.
 *
 * Vive en su propia capa de graficos para no mezclarse con los resaltados de
 * seleccion ni con el dibujo del usuario.
 */
import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import { useMapStore } from '@/store/useMapStore';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import { pointFromLatLong } from '@/services/projectionService';
import {
  closeStreetViewWindow,
  isStreetViewWindowOpen,
} from '@/services/googleStreetView';

/** Icono del muneco, en SVG embebido (sin dependencias externas). */
const PEGMAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
  <ellipse cx="17" cy="39" rx="9" ry="3" fill="rgba(0,0,0,.25)"/>
  <circle cx="17" cy="8" r="6" fill="#f5c396" stroke="#8a5a2b" stroke-width="1.5"/>
  <path d="M11 15h12a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-1v7a2 2 0 0 1-4 0v-6h-4v6a2 2 0 0 1-4 0v-7H10a2 2 0 0 1-2-2v-9a3 3 0 0 1 3-3z"
        fill="#0091ea" stroke="#005b9f" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;

const PEGMAN_URL = `data:image/svg+xml;base64,${btoa(PEGMAN_SVG)}`;

export function StreetViewMarker() {
  const view = useMapStore((s) => s.view);
  const { open, latitude, longitude, close } = useStreetViewStore();
  const layerRef = useRef<GraphicsLayer | null>(null);

  // Capa propia para el marcador.
  useEffect(() => {
    if (!view) return;
    const layer = new GraphicsLayer({ title: 'Street View', listMode: 'hide' });
    view.map?.add(layer);
    layerRef.current = layer;
    return () => {
      view.map?.remove(layer);
      layer.destroy();
      layerRef.current = null;
    };
  }, [view]);

  // Coloca o quita el muneco segun el estado de Street View.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !view) return;
    let cancelled = false;

    if (!open || latitude == null || longitude == null) {
      layer.removeAll();
      return;
    }

    (async () => {
      try {
        const wkid = view.spatialReference?.wkid ?? 4326;
        const point = await pointFromLatLong(latitude, longitude, wkid);
        if (cancelled || !layerRef.current) return;
        layerRef.current.removeAll();
        layerRef.current.add(
          new Graphic({
            geometry: point,
            symbol: {
              type: 'picture-marker',
              url: PEGMAN_URL,
              width: '34px',
              height: '42px',
              yoffset: '16px',
            } as never,
          }),
        );
      } catch {
        /* si falla la reproyeccion, simplemente no se dibuja el marcador */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, latitude, longitude, view]);

  // Si el usuario cierra la ventana emergente de Google, se retira el muneco.
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      if (!isStreetViewWindowOpen()) {
        close();
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [open, close]);

  // Al desmontar (salir de sesion, recargar config) se cierra todo.
  useEffect(() => () => closeStreetViewWindow(), []);

  return null;
}
