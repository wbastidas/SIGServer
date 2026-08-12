/**
 * Estado de Google Street View (RF-GSV).
 *
 * Dos modos segun haya o no clave de Google:
 *  - CON clave: se incrusta el panorama en el panel flotante de la app.
 *  - SIN clave: no es posible incrustarlo, asi que se abre Street View en una
 *    ventana emergente independiente del navegador (no requiere API key).
 */
import { create } from 'zustand';
import { getGoogleKey, openStreetViewWindow } from '@/services/googleStreetView';

interface StreetViewState {
  /** Panel incrustado visible (solo cuando hay clave). */
  open: boolean;
  latitude: number | null;
  longitude: number | null;
  /** El navegador bloqueo la ventana emergente: se ofrece un enlace manual. */
  popupBlocked: boolean;
  /** Modo "clic en el mapa para ver Street View". */
  pickOnMap: boolean;

  openAt: (lat: number, lng: number) => void;
  close: () => void;
  setPickOnMap: (active: boolean) => void;
  clearBlocked: () => void;
}

export const useStreetViewStore = create<StreetViewState>((set) => ({
  open: false,
  latitude: null,
  longitude: null,
  popupBlocked: false,
  pickOnMap: false,

  openAt: (latitude, longitude) => {
    if (getGoogleKey()) {
      set({ open: true, latitude, longitude, popupBlocked: false });
      return;
    }
    // Sin clave: ventana emergente independiente.
    const opened = openStreetViewWindow(latitude, longitude);
    set({
      open: !opened, // si fue bloqueada, mostramos el panel con el enlace
      latitude,
      longitude,
      popupBlocked: !opened,
    });
  },
  close: () => set({ open: false, popupBlocked: false }),
  setPickOnMap: (pickOnMap) => set({ pickOnMap }),
  clearBlocked: () => set({ popupBlocked: false }),
}));
