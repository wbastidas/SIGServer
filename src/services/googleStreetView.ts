/**
 * Carga diferida de la Google Maps JavaScript API para Street View (RF-GSV).
 * Dependencia externa opcional: si no hay clave o conexion, degrada con elegancia
 * (RF-GSV-04). La clave viene de VITE_GOOGLE_MAPS_KEY (fuera del bundle sensible).
 */

let loadPromise: Promise<typeof google | null> | null = null;

export function getGoogleKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '';
}

/**
 * URL publica de Google Street View. NO requiere clave de API: abre la vista de
 * calle directamente en Google Maps.
 */
export function streetViewUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
}

/**
 * Abre Street View en una ventana emergente independiente del navegador.
 * Es la via usada cuando no hay clave de Google (no se puede incrustar el
 * panorama dentro de la app sin API key). Devuelve false si el navegador
 * bloqueo la ventana emergente.
 */
/** Referencia a la ventana emergente, para reutilizarla en vez de abrir otra. */
let streetViewWindow: Window | null = null;

export function openStreetViewWindow(latitude: number, longitude: number): boolean {
  const url = streetViewUrl(latitude, longitude);
  const features = 'width=1000,height=700,menubar=no,toolbar=no,location=yes,resizable=yes';

  // Si ya hay una ventana abierta se NAVEGA en ella; asi al elegir otro punto
  // no se acumulan ventanas nuevas.
  if (streetViewWindow && !streetViewWindow.closed) {
    try {
      streetViewWindow.location.href = url;
      streetViewWindow.focus();
      return true;
    } catch {
      // Si el navegador impide navegarla (otro origen), se reabre por nombre.
    }
  }

  const win = window.open(url, 'sig-street-view', features);
  if (win) {
    streetViewWindow = win;
    win.focus();
    return true;
  }
  return false;
}

/** true si la ventana emergente sigue abierta. */
export function isStreetViewWindowOpen(): boolean {
  return !!streetViewWindow && !streetViewWindow.closed;
}

/** Cierra la ventana emergente si esta abierta. */
export function closeStreetViewWindow(): void {
  if (streetViewWindow && !streetViewWindow.closed) {
    try {
      streetViewWindow.close();
    } catch {
      /* el navegador puede impedir cerrarla */
    }
  }
  streetViewWindow = null;
}

export function loadGoogleMaps(): Promise<typeof google | null> {
  if (loadPromise) return loadPromise;
  const key = getGoogleKey();
  if (!key) {
    loadPromise = Promise.resolve(null);
    return loadPromise;
  }
  loadPromise = new Promise((resolve) => {
    if (typeof (window as any).google?.maps !== 'undefined') {
      resolve((window as any).google);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return loadPromise;
}
