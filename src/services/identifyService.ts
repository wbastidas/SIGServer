/**
 * Identify: al pulsar un punto del mapa devuelve TODOS los elementos que hay
 * debajo, de todas las capas visibles (RF-POP-01/02).
 *
 * A diferencia del popup normal de una capa, aqui interesa ver el elemento y
 * "los demas que estan debajo" en una sola ventana, que es como se consulta una
 * red: en un mismo punto coinciden poste, transformador, luminaria, etc.
 */
import Extent from '@arcgis/core/geometry/Extent';
import Graphic from '@arcgis/core/Graphic';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import FieldsContent from '@arcgis/core/popup/content/FieldsContent';
import type MapView from '@arcgis/core/views/MapView';
import { getQueryableLayers, onlyVisible } from './layerRegistry';
import { safeQueryFeatures } from './safeQuery';

/** Tolerancia del clic, en pixeles de pantalla. */
const CLICK_TOLERANCE_PX = 6;

/** Maximo de elementos por capa: evita saturar el popup. */
const MAX_PER_LAYER = 25;

export interface IdentifyResult {
  /** Elementos listos para el popup, con su plantilla y titulo por capa. */
  features: Graphic[];
  /** Resumen por capa, para informar cuantos hay de cada tipo. */
  byLayer: { title: string; count: number }[];
}

/**
 * Consulta todas las capas visibles alrededor del punto pulsado y prepara los
 * elementos para mostrarlos en un unico popup navegable.
 */
export async function identifyAt(
  view: MapView,
  mapPoint: __esri.Point,
): Promise<IdentifyResult> {
  const tolerance = CLICK_TOLERANCE_PX * (view.resolution || 1);
  const box = new Extent({
    xmin: mapPoint.x - tolerance,
    ymin: mapPoint.y - tolerance,
    xmax: mapPoint.x + tolerance,
    ymax: mapPoint.y + tolerance,
    spatialReference: mapPoint.spatialReference,
  });

  const layers = onlyVisible(await getQueryableLayers(view.map));

  const settled = await Promise.allSettled(
    layers.map(async (ql) => {
      const features = await safeQueryFeatures(ql.layer, {
        geometry: box,
        spatialRelationship: 'intersects',
        outFields: ['*'],
        returnGeometry: true,
        limit: MAX_PER_LAYER,
      });
      return { title: ql.title, features };
    }),
  );

  const all: Graphic[] = [];
  const byLayer: { title: string; count: number }[] = [];

  for (const res of settled) {
    if (res.status !== 'fulfilled' || res.value.features.length === 0) continue;
    byLayer.push({ title: res.value.title, count: res.value.features.length });

    for (const feature of res.value.features) {
      // Cada elemento lleva su propia plantilla, titulada con la capa de origen,
      // para que al navegar entre resultados se sepa que se esta viendo.
      feature.popupTemplate = new PopupTemplate({
        title: res.value.title,
        outFields: ['*'],
        content: [new FieldsContent()],
      });
      all.push(feature);
    }
  }

  return { features: all, byLayer };
}
