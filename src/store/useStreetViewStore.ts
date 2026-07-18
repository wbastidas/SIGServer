/** Estado del panel flotante de Google Street View (RF-GSV). */
import { create } from 'zustand';

interface StreetViewState {
  open: boolean;
  latitude: number | null;
  longitude: number | null;
  openAt: (lat: number, lng: number) => void;
  close: () => void;
}

export const useStreetViewStore = create<StreetViewState>((set) => ({
  open: false,
  latitude: null,
  longitude: null,
  openAt: (latitude, longitude) => set({ open: true, latitude, longitude }),
  close: () => set({ open: false }),
}));
