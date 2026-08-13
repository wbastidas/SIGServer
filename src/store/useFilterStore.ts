/**
 * Estado del filtro activo.
 *
 * Vive fuera del panel para que el filtro sea VISIBLE aunque el panel este
 * cerrado: la aplicacion muestra un aviso permanente sobre el mapa con lo que
 * se esta filtrando y un boton para apagarlo.
 */
import { create } from 'zustand';

export interface ActiveFilter {
  /** Identificador del filtro configurado. */
  id: string;
  label: string;
  values: string[];
  /** Capas afectadas, para informar del alcance. */
  layerTitles: string[];
}

interface FilterState {
  active: ActiveFilter | null;
  setActive: (filter: ActiveFilter | null) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  active: null,
  setActive: (active) => set({ active }),
  clear: () => set({ active: null }),
}));
