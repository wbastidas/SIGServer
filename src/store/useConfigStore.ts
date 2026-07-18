/**
 * Store central de configuracion. Se puebla una vez al arranque y expone la
 * configuracion tipada a todos los modulos (RF-ARQ-01: modulos desacoplados que
 * comparten estado por el store central).
 */
import { create } from 'zustand';
import type { FullConfig } from '@/types/config';
import { loadFullConfig } from '@/config/configLoader';

interface ConfigState {
  config: FullConfig | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  reload: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const config = await loadFullConfig();
      set({ config, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  reload: async () => {
    // Recarga de configuracion sin recompilar (RNF-CFG-03).
    set({ loading: true, error: null });
    try {
      const config = await loadFullConfig();
      set({ config, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
