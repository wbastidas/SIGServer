/**
 * Servicio de seleccion espacial (RF-SEL-01). Selecciona por clic (hitTest) y
 * por dibujo de rectangulo/poligono, consultando las FeatureLayers activas.
 */
import Graphic from '@arcgis/core/Graphic';
import type MapView from '@arcgis/core/views/MapView';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type Geometry from '@arcgis/core/geometry/Geometry';
import { featuresToCsv } from './queryUtils';

export { featuresToCsv };

/** Seleccion por clic: devuelve los graficos de FeatureLayers bajo el puntero. */
export async function selectByClick(
  view: MapView,
  screenPoint: __esri.MapViewScreenPoint | MouseEvent,
): Promise<Graphic[]> {
  const response = await view.hitTest(screenPoint);
  return response.results
    .filter((r): r is __esri.GraphicHit => (r as any).graphic != null)
    .map((r) => r.graphic)
    .filter((g) => g.layer?.type === 'feature');
}

/** Seleccion por geometria (rectangulo/poligono) sobre las FeatureLayers dadas. */
export async function selectByGeometry(
  geometry: Geometry,
  featureLayers: FeatureLayer[],
): Promise<Graphic[]> {
  const all: Graphic[] = [];
  for (const layer of featureLayers) {
    const query = layer.createQuery();
    query.geometry = geometry;
    query.spatialRelationship = 'intersects';
    query.outFields = ['*'];
    query.returnGeometry = true;
    query.num = 500; // limite (RNF-PERF-03)
    try {
      const result = await layer.queryFeatures(query);
      all.push(...result.features);
    } catch {
      /* capa sin soporte de query: se ignora */
    }
  }
  return all;
}
