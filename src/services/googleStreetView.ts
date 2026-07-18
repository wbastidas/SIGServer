/**
 * Carga diferida de la Google Maps JavaScript API para Street View (RF-GSV).
 * Dependencia externa opcional: si no hay clave o conexion, degrada con elegancia
 * (RF-GSV-04). La clave viene de VITE_GOOGLE_MAPS_KEY (fuera del bundle sensible).
 */

let loadPromise: Promise<typeof google | null> | null = null;

export function getGoogleKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '';
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
