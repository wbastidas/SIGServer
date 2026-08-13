/**
 * Utilidades de resaltado y navegacion a elementos, compartidas por Busqueda,
 * Seleccion y Tabla (RF-SRC-05, RF-SEL-03). Usa una capa de graficos temporal.
 */
import Graphic from '@arcgis/core/Graphic';
import type MapView from '@arcgis/core/views/MapView';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Geometry from '@arcgis/core/geometry/Geometry';
import { escapeHtml } from './queryUtils';

const HIGHLIGHT_POINT = {
  type: 'simple-marker' as const,
  style: 'circle' as const,
  color: [255, 128, 0, 0.6],
  size: 14,
  outline: { color: [255, 128, 0], width: 2 },
};

const HIGHLIGHT_LINE = {
  type: 'simple-line' as const,
  color: [255, 128, 0],
  width: 4,
};

const HIGHLIGHT_FILL = {
  type: 'simple-fill' as const,
  color: [255, 128, 0, 0.2],
  outline: { color: [255, 128, 0], width: 2 },
};

function symbolFor(geometry: Geometry) {
  switch (geometry.type) {
    case 'point':
    case 'multipoint':
      return HIGHLIGHT_POINT;
    case 'polyline':
      return HIGHLIGHT_LINE;
    default:
      return HIGHLIGHT_FILL;
  }
}

/** Limpia los resaltados temporales de la capa. */
export function clearHighlights(graphicsLayer: GraphicsLayer): void {
  graphicsLayer.removeAll();
}

/** Simbolos de "marcado como seleccionado" (mas llamativos que el resaltado simple). */
const SELECTED_POINT = {
  type: 'simple-marker' as const,
  style: 'circle' as const,
  color: [0, 200, 255, 0.35],
  size: 18,
  outline: { color: [0, 145, 234], width: 3 },
};

const SELECTED_LINE = {
  type: 'simple-line' as const,
  color: [0, 145, 234],
  width: 5,
};

const SELECTED_FILL = {
  type: 'simple-fill' as const,
  color: [0, 200, 255, 0.25],
  outline: { color: [0, 145, 234], width: 3 },
};

function selectedSymbolFor(geometry: Geometry) {
  switch (geometry.type) {
    case 'point':
    case 'multipoint':
      return SELECTED_POINT;
    case 'polyline':
      return SELECTED_LINE;
    default:
      return SELECTED_FILL;
  }
}

/**
 * Marca en el mapa el conjunto de elementos elegidos en la tabla
 * (sincronizacion tabla -> mapa, RF-SEL-04). Sustituye las marcas anteriores.
 */
export function markSelectedOnMap(
  graphicsLayer: GraphicsLayer,
  geometries: (Geometry | null | undefined)[],
): void {
  clearHighlights(graphicsLayer);
  for (const geometry of geometries) {
    if (!geometry) continue;
    graphicsLayer.add(new Graphic({ geometry, symbol: selectedSymbolFor(geometry) }));
  }
}

/** Encuadra el mapa sobre un conjunto de elementos marcados. */
export async function zoomToGeometries(
  view: MapView,
  geometries: (Geometry | null | undefined)[],
): Promise<void> {
  const valid = geometries.filter((g): g is Geometry => !!g);
  if (valid.length === 0) return;
  await view.goTo(valid).catch(() => undefined);
}

/**
 * Resalta una geometria, hace zoom/pan y opcionalmente abre el popup.
 */
export async function highlightAndZoom(
  view: MapView,
  graphicsLayer: GraphicsLayer,
  geometry: Geometry,
  options: {
    zoomScale?: number;
    attributes?: Record<string, any>;
    openPopup?: boolean;
    popupTitle?: string;
    keepPrevious?: boolean;
  } = {},
): Promise<void> {
  if (!options.keepPrevious) clearHighlights(graphicsLayer);

  const graphic = new Graphic({ geometry, symbol: symbolFor(geometry) });
  graphicsLayer.add(graphic);

  const target =
    geometry.type === 'point'
      ? { target: geometry, scale: options.zoomScale ?? 2000 }
      : { target: geometry.extent?.expand(1.5) ?? geometry };

  await view.goTo(target).catch(() => undefined);

  if (options.openPopup && options.attributes) {
    view.openPopup({
      location: geometry.type === 'point' ? (geometry as any) : geometry.extent?.center,
      title: options.popupTitle ?? 'Elemento',
      // Los valores vienen del servicio: se escapan para no inyectar HTML.
      content: Object.entries(options.attributes)
        .map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`)
        .join('<br/>'),
    });
  }
}
