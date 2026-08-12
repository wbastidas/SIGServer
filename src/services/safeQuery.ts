/**
 * Ejecucion segura de consultas contra capas de ArcGIS Server.
 *
 * Muchas capas publicadas como MapServer NO soportan paginacion
 * (`supportsPagination: false`). Enviarles `num`/`start` hace que el SDK
 * rechace la consulta con el error "Pagination is not supported", que es lo que
 * aparecia al buscar. Aqui se consulta la capacidad real de la capa y solo se
 * usa `num` cuando el servicio la admite; si no, se limita el resultado del
 * lado del cliente para no saturar el navegador (RNF-PERF-03).
 */
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type Graphic from '@arcgis/core/Graphic';

export interface SafeQueryOptions {
  where?: string;
  geometry?: __esri.Geometry;
  spatialRelationship?: __esri.Query['spatialRelationship'];
  outFields?: string[];
  returnGeometry?: boolean;
  returnDistinctValues?: boolean;
  orderByFields?: string[];
  distance?: number;
  units?: __esri.Query['units'];
  /** Maximo de registros deseado. Se aplica en servidor si hay paginacion. */
  limit?: number;
}

/** true si la capa declara soporte de paginacion en sus capacidades. */
export function supportsPagination(layer: FeatureLayer): boolean {
  return Boolean((layer as any)?.capabilities?.query?.supportsPagination);
}

/**
 * Consulta una capa aplicando `num` solo si el servicio soporta paginacion.
 * Devuelve como maximo `limit` elementos en cualquier caso.
 */
export async function safeQueryFeatures(
  layer: FeatureLayer,
  options: SafeQueryOptions,
): Promise<Graphic[]> {
  await layer.load();

  const query = layer.createQuery();
  if (options.where !== undefined) query.where = options.where;
  if (options.geometry) query.geometry = options.geometry as any;
  if (options.spatialRelationship) query.spatialRelationship = options.spatialRelationship;
  if (options.outFields) query.outFields = options.outFields;
  if (options.returnGeometry !== undefined) query.returnGeometry = options.returnGeometry;
  if (options.distance !== undefined) query.distance = options.distance;
  if (options.units) query.units = options.units;

  // returnDistinctValues tambien exige soporte del servicio; si no lo hay se
  // pide normal y se deduplica en cliente (lo hace quien llama).
  const wantDistinct = Boolean(options.returnDistinctValues);
  const canDistinct = Boolean((layer as any)?.capabilities?.query?.supportsDistinct);
  if (wantDistinct && canDistinct) query.returnDistinctValues = true;

  if (options.orderByFields && (layer as any)?.capabilities?.query?.supportsOrderBy) {
    query.orderByFields = options.orderByFields;
  }

  const limit = options.limit;
  if (limit && supportsPagination(layer)) {
    query.num = limit;
  }

  const result = await layer.queryFeatures(query);
  const features = result.features ?? [];
  return limit ? features.slice(0, limit) : features;
}
