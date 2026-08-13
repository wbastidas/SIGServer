/**
 * Estado de la ultima consulta de seleccion: permite que el panel y la tabla
 * informen de lo que esta pasando (consultando, sin resultados, resultado
 * recortado por volumen) sin acoplarse al componente que lanzo la consulta.
 */
import { create } from 'zustand';

interface SelectionRunState {
  busy: boolean;
  /** Elementos traidos. */
  count: number;
  /** Coincidencias reales en el servidor. */
  total: number;
  /** true si el servidor tenia mas elementos de los que se trajeron. */
  truncated: boolean;
  error: string | null;
  /** true tras una consulta que no devolvio nada. */
  empty: boolean;

  start: () => void;
  finish: (count: number, total: number, truncated: boolean) => void;
  fail: (error: string) => void;
  reset: () => void;
}

export const useSelectionRunStore = create<SelectionRunState>((set) => ({
  busy: false,
  count: 0,
  total: 0,
  truncated: false,
  error: null,
  empty: false,

  start: () => set({ busy: true, error: null, empty: false }),
  finish: (count, total, truncated) =>
    set({ busy: false, count, total, truncated, empty: count === 0, error: null }),
  fail: (error) => set({ busy: false, error, empty: false }),
  reset: () =>
    set({ busy: false, count: 0, total: 0, truncated: false, error: null, empty: false }),
}));
