/**
 * Opciones de creacion del MapView derivadas de la configuracion.
 *
 * Se extrae aqui (funcion pura) porque de estos valores depende que el zoom
 * funcione, y conviene poder probarlo sin navegador.
 *
 * Claves del comportamiento del zoom:
 *  - `snapToZoom: false` -> zoom CONTINUO. Si la vista usa un SR propio y el
 *    basemap teselado no aporta niveles LOD, con snapToZoom activo el zoom se
 *    ata a niveles inexistentes y la rueda / los botones dejan de responder.
 *  - Se usa `scale` y no `zoom`, porque `zoom` solo tiene sentido si existen LODs.
 *  - minScale/maxScale a 0 significa "sin limite".
 */
import type { MapConfig } from '@/types/config';

export interface ViewConstraints {
  snapToZoom: boolean;
  minScale: number;
  maxScale: number;
  rotationEnabled: boolean;
}

export interface ViewOptions {
  constraints: ViewConstraints;
  /** Escala inicial cuando no hay extension configurada. */
  scale?: number;
  /** true si debe usarse `initialExtent` en lugar de `scale`. */
  useExtent: boolean;
}

/** Convierte un nivel de zoom "tipo web" a escala cartografica. */
export function zoomToScale(zoom?: number): number {
  const level = zoom ?? 12;
  return 591657527.591555 / 2 ** level;
}

export function hasUsableExtent(map: MapConfig): boolean {
  const e = map.initialExtent;
  return !!e && (e.xmax !== 0 || e.ymax !== 0);
}

export function buildViewOptions(map: MapConfig): ViewOptions {
  const useExtent = hasUsableExtent(map);
  return {
    constraints: {
      snapToZoom: false,
      minScale: (map.minScale ?? 0) > 0 ? map.minScale! : 0,
      maxScale: (map.maxScale ?? 0) > 0 ? map.maxScale! : 0,
      rotationEnabled: false,
    },
    useExtent,
    scale: useExtent ? undefined : zoomToScale(map.initialZoom),
  };
}
