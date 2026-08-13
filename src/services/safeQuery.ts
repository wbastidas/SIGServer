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

/** Tamano de lote al traer muchos elementos (RNF-PERF-03). */
export const PAGE_SIZE = 1000;

export interface PagedResult {
  features: Graphic[];
  /** Total real en el servidor (si se pudo contar). */
  total: number;
  /** true si se dejaron elementos sin traer por alcanzar el maximo. */
  truncated: boolean;
}

/**
 * Trae elementos por lotes en lugar de todos de golpe.
 *
 * Pedir de una vez decenas de miles de elementos bloquea el navegador (era el
 * caso de "cuando son muchos elementos se muere"). Aqui se cuenta primero y se
 * traen de PAGE_SIZE en PAGE_SIZE hasta `maxTotal`, informando si quedaron
 * elementos fuera para que la interfaz lo advierta.
 *
 * Si el servicio no soporta paginacion se hace una unica consulta acotada.
 */
export async function pagedQueryFeatures(
  layer: FeatureLayer,
  options: SafeQueryOptions,
  maxTotal: number,
): Promise<PagedResult> {
  await layer.load();

  const makeQuery = () => {
    const q = layer.createQuery();
    if (options.where !== undefined) q.where = options.where;
    if (options.geometry) q.geometry = options.geometry as any;
    if (options.spatialRelationship) q.spatialRelationship = options.spatialRelationship;
    if (options.outFields) q.outFields = options.outFields;
    if (options.returnGeometry !== undefined) q.returnGeometry = options.returnGeometry;
    return q;
  };

  // Cuenta previa: permite avisar del volumen sin descargar nada.
  let total = 0;
  try {
    total = await layer.queryFeatureCount(makeQuery());
  } catch {
    total = 0;
  }

  if (!supportsPagination(layer)) {
    const features = await safeQueryFeatures(layer, { ...options, limit: maxTotal });
    return {
      features,
      total: total || features.length,
      truncated: total > features.length,
    };
  }

  const features: Graphic[] = [];
  const objectIdField = layer.objectIdField;

  for (let start = 0; start < maxTotal; start += PAGE_SIZE) {
    const q = makeQuery();
    q.start = start;
    q.num = Math.min(PAGE_SIZE, maxTotal - start);
    // La paginacion exige un orden estable para no repetir ni saltar registros.
    if (objectIdField) q.orderByFields = [objectIdField];

    const page = await layer.queryFeatures(q);
    const batch = page.features ?? [];
    features.push(...batch);
    if (batch.length < q.num) break; // no hay mas
  }

  return {
    features,
    total: total || features.length,
    truncated: total > features.length,
  };
}
