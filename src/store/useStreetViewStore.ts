/**
 * Estado de Google Street View (RF-GSV).
 *
 * Dos formas de mostrarlo segun haya o no clave de Google:
 *  - CON clave: panorama incrustado en el panel flotante de la app.
 *  - SIN clave: ventana emergente del navegador (la URL publica de Google Maps
 *    no requiere API key). Se reutiliza la MISMA ventana al elegir otro punto.
 *
 * En ambos casos `active` indica que Street View esta mostrando una ubicacion,
 * que es lo que usa el mapa para dibujar el muneco en ese punto.
 */
import { create } from 'zustand';
import {
  closeStreetViewWindow,
  getGoogleKey,
  openStreetViewWindow,
} from '@/services/googleStreetView';

interface StreetViewState {
  /** Hay una ubicacion mostrandose (en panel o en ventana externa). */
  open: boolean;
  /** true si el panorama va incrustado en la app (hay clave de Google). */
  embedded: boolean;
  latitude: number | null;
  longitude: number | null;
  /** El navegador bloqueo la ventana emergente: se ofrece un enlace manual. */
  popupBlocked: boolean;
  /** Modo "clic en el mapa para ver Street View". */
  pickOnMap: boolean;

  openAt: (lat: number, lng: number) => void;
  close: () => void;
  setPickOnMap: (active: boolean) => void;
}

export const useStreetViewStore = create<StreetViewState>((set) => ({
  open: false,
  embedded: false,
  latitude: null,
  longitude: null,
  popupBlocked: false,
  pickOnMap: false,

  openAt: (latitude, longitude) => {
    if (getGoogleKey()) {
      set({ open: true, embedded: true, latitude, longitude, popupBlocked: false });
      return;
    }
    // Sin clave: ventana emergente independiente, reutilizada si ya existe.
    const opened = openStreetViewWindow(latitude, longitude);
    set({
      open: true,
      embedded: false,
      latitude,
      longitude,
      popupBlocked: !opened,
    });
  },

  close: () => {
    closeStreetViewWindow();
    set({ open: false, popupBlocked: false, latitude: null, longitude: null });
  },

  setPickOnMap: (pickOnMap) => set({ pickOnMap }),
}));
