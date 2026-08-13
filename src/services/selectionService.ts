/**
 * Servicio de seleccion espacial (RF-SEL-01).
 *
 * Funciona tanto si las capas estan cargadas como `FeatureLayer` como si el
 * servicio operacional se carga como `MapImageLayer`: en ese segundo caso las
 * subcapas se consultan a traves del registro de capas (layerRegistry), que las
 * expone como FeatureLayer consultables. Antes la seleccion recorria una lista
 * de FeatureLayers que estaba vacia en modo "mapimage" y nunca devolvia nada.
 */
import Extent from '@arcgis/core/geometry/Extent';
import type MapView from '@arcgis/core/views/MapView';
import type Graphic from '@arcgis/core/Graphic';
import type Geometry from '@arcgis/core/geometry/Geometry';
import { getQueryableLayers, onlyVisible, type QueryableLayer } from './layerRegistry';
import { pagedQueryFeatures } from './safeQuery';

/**
 * Maximo de elementos traidos por capa. Se traen por lotes de 1000; superado
 * este techo se avisa al usuario en lugar de intentar cargarlo todo y colgar
 * el navegador (RNF-PERF-03).
 */
const MAX_PER_LAYER = 5000;

/** Tolerancia del clic, en pixeles de pantalla. */
const CLICK_TOLERANCE_PX = 6;

export interface SelectionResult {
  features: Graphic[];
  /** Titulo de la capa de la que proviene cada grupo, para la tabla. */
  byLayer: { title: string; features: Graphic[] }[];
  /** Total de coincidencias en el servidor (puede superar lo traido). */
  total: number;
  /** true si se alcanzo el techo y quedaron elementos sin traer. */
  truncated: boolean;
}

/**
 * Selecciona por clic. Convierte el punto de pantalla en un area de tolerancia
 * en unidades del mapa y consulta las capas visibles. Sirve para FeatureLayer
 * y para subcapas de MapImageLayer (que no son "hit-testables").
 */
export async function selectByClick(
  view: MapView,
  mapPoint: __esri.Point,
): Promise<SelectionResult> {
  // Rectangulo de tolerancia en unidades del mapa: evita depender de la unidad
  // del sistema de referencia (grados vs. metros) al usar `distance`.
  const tolerance = CLICK_TOLERANCE_PX * (view.resolution || 1);
  const box = new Extent({
    xmin: mapPoint.x - tolerance,
    ymin: mapPoint.y - tolerance,
    xmax: mapPoint.x + tolerance,
    ymax: mapPoint.y + tolerance,
    spatialReference: mapPoint.spatialReference,
  });
  const layers = onlyVisible(await getQueryableLayers(view.map));
  return queryLayers(layers, box);
}

/** Selecciona por geometria dibujada (rectangulo/poligono). */
export async function selectByGeometry(
  view: MapView,
  geometry: Geometry,
): Promise<SelectionResult> {
  const layers = onlyVisible(await getQueryableLayers(view.map));
  return queryLayers(layers, geometry);
}

async function queryLayers(
  layers: QueryableLayer[],
  geometry: Geometry,
): Promise<SelectionResult> {
  const byLayer: { title: string; features: Graphic[] }[] = [];
  const all: Graphic[] = [];
  let total = 0;
  let truncated = false;

  // Consulta en paralelo: una capa lenta no bloquea al resto. Cada capa se trae
  // por lotes para no bloquear el navegador con selecciones grandes.
  const settled = await Promise.allSettled(
    layers.map(async (ql) => {
      const page = await pagedQueryFeatures(
        ql.layer,
        {
          geometry: geometry as __esri.Geometry,
          spatialRelationship: 'intersects',
          outFields: ['*'],
          returnGeometry: true,
        },
        MAX_PER_LAYER,
      );
      return { title: ql.title, ...page };
    }),
  );

  for (const res of settled) {
    if (res.status !== 'fulfilled') continue; // capa sin soporte de consulta
    if (res.value.features.length === 0) continue;
    byLayer.push({ title: res.value.title, features: res.value.features });
    all.push(...res.value.features);
    total += res.value.total;
    if (res.value.truncated) truncated = true;
  }

  return { features: all, byLayer, total, truncated };
}
