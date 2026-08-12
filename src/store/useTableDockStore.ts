/**
 * Estado del panel de tablas acoplado bajo el mapa (flotante).
 * Se separa del panel lateral para que las tablas tengan ancho completo y no
 * compitan con las herramientas.
 */
import { create } from 'zustand';

export type DockTab = 'selection' | 'layer';

interface TableDockState {
  open: boolean;
  tab: DockTab;
  /** Alto en pixeles del panel acoplado. */
  height: number;
  openTab: (tab: DockTab) => void;
  toggle: () => void;
  close: () => void;
  setHeight: (height: number) => void;
}

export const useTableDockStore = create<TableDockState>((set, get) => ({
  open: false,
  tab: 'selection',
  height: 280,
  openTab: (tab) => set({ open: true, tab }),
  toggle: () => set({ open: !get().open }),
  close: () => set({ open: false }),
  setHeight: (height) => set({ height: Math.max(160, Math.min(height, 700)) }),
}));
