/**
 * Modo de interaccion con el mapa.
 *
 * Centralizar esto resuelve un problema real: antes cada panel registraba su
 * propio manejador de clic, asi que al cerrar el panel (o la tabla) se dejaba
 * de poder seleccionar. Ahora el modo vive en el estado global y un unico
 * componente persistente atiende los clics, independientemente de que paneles
 * esten abiertos.
 */
import { create } from 'zustand';

export type MapMode =
  /** Por defecto: al pulsar se identifican todos los elementos bajo el punto. */
  | 'identify'
  /** Seleccion pulsando elementos. */
  | 'select-click'
  /** Seleccion dibujando un rectangulo. */
  | 'select-rectangle'
  /** Seleccion dibujando un poligono. */
  | 'select-polygon'
  /** Elegir un punto para abrir Street View. */
  | 'streetview';

interface InteractionState {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  /** Vuelve al modo por defecto (identify). */
  reset: () => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
  mode: 'identify',
  setMode: (mode) => set({ mode }),
  reset: () => set({ mode: 'identify' }),
}));

export function isSelectionMode(mode: MapMode): boolean {
  return mode.startsWith('select-');
}
