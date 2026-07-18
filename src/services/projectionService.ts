/**
 * Reproyeccion de coordenadas usando el motor del SDK (RF-GOTO-02, RF-MAP-03).
 * Convierte Lat/Long (WGS84 / 4326) al SR del mapa y viceversa.
 */
import Point from '@arcgis/core/geometry/Point';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import * as projection from '@arcgis/core/geometry/projection';

let loaded = false;

async function ensureLoaded(): Promise<void> {
  if (!loaded) {
    await projection.load();
    loaded = true;
  }
}

/** Proyecta un punto a un WKID destino. */
export async function projectPoint(point: Point, targetWkid: number): Promise<Point> {
  if (point.spatialReference?.wkid === targetWkid) return point;
  await ensureLoaded();
  const target = new SpatialReference({ wkid: targetWkid });
  const result = projection.project(point, target);
  return Array.isArray(result) ? (result[0] as Point) : (result as Point);
}

/** Construye un Point a partir de X/Y en un WKID de entrada y lo reproyecta al SR del mapa. */
export async function pointFromXY(
  x: number,
  y: number,
  inputWkid: number,
  mapWkid: number,
): Promise<Point> {
  const source = new Point({ x, y, spatialReference: new SpatialReference({ wkid: inputWkid }) });
  return projectPoint(source, mapWkid);
}

/** Construye un Point desde Lat/Long (4326) y lo reproyecta al SR del mapa. */
export async function pointFromLatLong(
  latitude: number,
  longitude: number,
  mapWkid: number,
): Promise<Point> {
  const source = new Point({ latitude, longitude, spatialReference: SpatialReference.WGS84 });
  return projectPoint(source, mapWkid);
}

/** Devuelve Lat/Long (4326) de un punto en cualquier SR (para Street View). */
export async function toLatLong(point: Point): Promise<{ latitude: number; longitude: number }> {
  const projected = await projectPoint(point, 4326);
  return { latitude: projected.latitude ?? projected.y, longitude: projected.longitude ?? projected.x };
}
