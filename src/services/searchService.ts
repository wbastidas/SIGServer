/**
 * Servicio de busqueda configurable (RF-SRC-01..07).
 *  - Busqueda directa por atributo con LIKE insensible a mayusculas (RF-SRC-02).
 *  - Busqueda sobre tablas no espaciales con resolucion del elemento relacionado
 *    por queryRelatedFeatures (relationshipId) o join por campo llave (RF-SRC-03/04).
 *  - Sugerencias/autocompletado opcional (RF-SRC-07).
 * Paginacion/limite para no saturar el navegador (RNF-PERF-03).
 */
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Graphic from '@arcgis/core/Graphic';
import type {
  LayerSearch,
  RelatedTableSearch,
  SearchDefinition,
} from '@/types/config';
import { buildWhere, escapeLike } from './queryUtils';
import { safeQueryFeatures } from './safeQuery';

const MAX_RESULTS = 50;

export interface SearchResult {
  /** Etiqueta legible para la lista. */
  label: string;
  /** Geometria del elemento espacial (puede ser undefined si no se resolvio). */
  geometry?: __esri.Geometry;
  attributes: Record<string, any>;
  /** Escala de zoom sugerida. */
  zoomScale?: number;
  /** Titulo para el popup. */
  popupTitle?: string;
}

const layerCache = new Map<string, FeatureLayer>();

function getLayer(url: string): FeatureLayer {
  let layer = layerCache.get(url);
  if (!layer) {
    layer = new FeatureLayer({ url });
    layerCache.set(url, layer);
  }
  return layer;
}

/** RF-SRC-02: busqueda directa sobre una capa espacial. */
async function searchLayer(def: LayerSearch, term: string): Promise<SearchResult[]> {
  const layer = getLayer(def.url);
  const where = buildWhere(def.searchField, def.operator, term, def.caseInsensitive);
  const features = await safeQueryFeatures(layer, {
    where,
    outFields: def.outFields?.length ? def.outFields : ['*'],
    returnGeometry: def.returnGeometry ?? true,
    limit: MAX_RESULTS,
  });
  return features.map((f) => ({
    label: String(f.attributes[def.displayField] ?? '(sin valor)'),
    geometry: f.geometry ?? undefined,
    attributes: f.attributes,
    zoomScale: def.zoomScale,
    popupTitle: `${def.label}: ${f.attributes[def.displayField] ?? ''}`,
  }));
}

/** RF-SRC-03/04: busqueda sobre tabla resolviendo el elemento espacial relacionado. */
async function searchRelatedTable(def: RelatedTableSearch, term: string): Promise<SearchResult[]> {
  const sourceLayer = getLayer(def.source.url);
  const where = buildWhere(
    def.source.searchField,
    def.source.operator,
    term,
    def.source.caseInsensitive,
  );
  const sourceFeatures = await safeQueryFeatures(sourceLayer, {
    where,
    outFields: ['*'],
    returnGeometry: false,
    limit: MAX_RESULTS,
  });

  if (sourceFeatures.length === 0) return [];

  if (def.relation.mode === 'relationshipId') {
    return resolveByRelationship(def, sourceLayer, sourceFeatures);
  }
  return resolveByJoin(def, sourceFeatures);
}

async function resolveByRelationship(
  def: RelatedTableSearch,
  sourceLayer: FeatureLayer,
  sourceFeatures: Graphic[],
): Promise<SearchResult[]> {
  const objectIds = sourceFeatures
    .map((f) => f.attributes[sourceLayer.objectIdField])
    .filter((id) => id != null);
  if (objectIds.length === 0) return [];

  const related = await sourceLayer.queryRelatedFeatures({
    relationshipId: def.relation.relationshipId!,
    objectIds,
    outFields: ['*'],
    returnGeometry: def.returnGeometry ?? true,
  });

  const results: SearchResult[] = [];
  for (const key of Object.keys(related)) {
    const set = related[Number(key)];
    if (!set) continue;
    for (const feat of set.features) {
      results.push({
        label: String(feat.attributes[def.source.searchField] ?? feat.attributes.OBJECTID),
        geometry: feat.geometry ?? undefined,
        attributes: feat.attributes,
        zoomScale: def.zoomScale,
        popupTitle: def.label,
      });
    }
  }
  return results;
}

async function resolveByJoin(
  def: RelatedTableSearch,
  sourceFeatures: Graphic[],
): Promise<SearchResult[]> {
  const keyField = def.relation.keyField ?? def.source.searchField;
  const targetKeyField = def.relation.targetKeyField ?? keyField;
  const keys = sourceFeatures
    .map((f) => f.attributes[keyField])
    .filter((v) => v != null)
    .map((v) => `'${escapeLike(String(v))}'`);
  if (keys.length === 0) return [];

  const targetLayer = getLayer(def.relation.targetLayerUrl);
  const uniqueKeys = Array.from(new Set(keys));
  const features = await safeQueryFeatures(targetLayer, {
    where: `${targetKeyField} IN (${uniqueKeys.join(',')})`,
    outFields: ['*'],
    returnGeometry: def.returnGeometry ?? true,
    limit: MAX_RESULTS,
  });
  return features.map((f) => ({
    label: String(f.attributes[targetKeyField] ?? '(sin valor)'),
    geometry: f.geometry ?? undefined,
    attributes: f.attributes,
    zoomScale: def.zoomScale,
    popupTitle: def.label,
  }));
}

export async function runSearch(def: SearchDefinition, term: string): Promise<SearchResult[]> {
  if (!term.trim()) return [];
  if (def.type === 'layer') return searchLayer(def, term);
  return searchRelatedTable(def, term);
}

/** RF-SRC-07: sugerencias (mismos datos, campo de display). */
export async function getSuggestions(def: SearchDefinition, term: string): Promise<string[]> {
  if (!term.trim() || term.length < 2) return [];
  const field = def.type === 'layer' ? def.searchField : def.source.searchField;
  const url = def.type === 'layer' ? def.url : def.source.url;
  const operator = def.type === 'layer' ? def.operator : def.source.operator;
  const ci = def.type === 'layer' ? def.caseInsensitive : def.source.caseInsensitive;
  const layer = getLayer(url);
  const features = await safeQueryFeatures(layer, {
    where: buildWhere(field, operator, term, ci),
    outFields: [field],
    returnGeometry: false,
    limit: 10,
    orderByFields: [field],
  });
  const values = features
    .map((f) => f.attributes[field])
    .filter((v): v is string | number => v != null)
    .map(String);
  return Array.from(new Set(values)).slice(0, 10);
}
