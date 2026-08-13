/**
 * Filtrado por atributo sobre todas las capas que tengan el campo (RF-FIL).
 *
 * En una red electrica el mismo concepto aparece con nombres distintos segun la
 * capa: el alimentador es `ALIMENTADORID` en casi todas y `ALIMENTADOR` solo en
 * postes. Por eso el filtro se define por CAMPO y se resuelve contra el
 * esquema real de cada capa, en lugar de fijarse a una capa concreta.
 *
 * Aplicacion:
 *  - Subcapas de MapImageLayer -> `definitionExpression` (deja de dibujarse lo
 *    que no cumple).
 *  - FeatureLayer -> `definitionExpression` tambien, para que el filtro sea
 *    consistente entre ambos modos.
 */
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import type EsriMap from '@arcgis/core/Map';
import type { FilterConfig } from '@/types/config';
import { buildValueWhere } from './queryUtils';
import { safeQueryFeatures } from './safeQuery';

/** Una capa a la que se puede aplicar el filtro, con el campo que si tiene. */
export interface FilterTarget {
  /** Etiqueta legible (nombre de la capa o subcapa). */
  title: string;
  /** Campo real publicado por esa capa (respetando su uso de mayusculas). */
  field: string;
  /** Aplica la clausula; cadena vacia la retira. */
  apply: (where: string) => void;
  /** Capa consultable, para leer los valores distintos. */
  queryLayer: FeatureLayer;
}

/** Campos configurados, admitiendo la forma antigua de un solo campo. */
export function filterFields(cfg: FilterConfig): string[] {
  if (cfg.fields?.length) return cfg.fields;
  return cfg.field ? [cfg.field] : [];
}

/**
 * Etiqueta del filtro para la interfaz.
 *
 * Nunca devuelve cadena vacia: un filtro mal configurado apareceria como una
 * opcion en blanco imposible de elegir.
 */
export function filterLabel(cfg: FilterConfig): string {
  if (cfg.label?.trim()) return cfg.label;
  const fields = filterFields(cfg);
  return fields.length > 0 ? fields.join(' / ') : 'Filtro';
}

function matchesOnlyLayers(
  cfg: FilterConfig,
  id: number | undefined,
  title: string,
): boolean {
  // Compatibilidad: `layerId` restringe a esa subcapa.
  if (cfg.layerId != null && id !== cfg.layerId) return false;
  if (!cfg.onlyLayers?.length) return true;
  return cfg.onlyLayers.some((entry) =>
    typeof entry === 'number'
      ? entry === id
      : String(entry).toLowerCase() === title.toLowerCase(),
  );
}

/** Busca en los campos publicados uno que coincida (sin distinguir mayusculas). */
function findField(fields: __esri.Field[] | null | undefined, wanted: string[]): string | null {
  if (!fields) return null;
  for (const want of wanted) {
    const hit = fields.find((f) => f.name?.toLowerCase() === want.toLowerCase());
    if (hit?.name) return hit.name;
  }
  return null;
}

/**
 * Devuelve todas las capas del mapa a las que aplica el filtro, resolviendo en
 * cada una el nombre real del campo.
 */
export async function resolveFilterTargets(
  map: EsriMap | null | undefined,
  cfg: FilterConfig,
): Promise<FilterTarget[]> {
  if (!map) return [];
  const wanted = filterFields(cfg);
  if (wanted.length === 0) return [];

  const targets: FilterTarget[] = [];

  for (const layer of map.layers.toArray()) {
    if (layer.listMode === 'hide') continue;

    if (layer instanceof FeatureLayer) {
      try {
        await layer.load();
      } catch {
        continue;
      }
      const title = layer.title ?? 'Capa';
      const field = findField(layer.fields, wanted);
      if (!field || !matchesOnlyLayers(cfg, undefined, title)) continue;
      targets.push({
        title,
        field,
        queryLayer: layer,
        apply: (where) => {
          layer.definitionExpression = where || (null as never);
        },
      });
      continue;
    }

    if (layer instanceof MapImageLayer) {
      try {
        await layer.load();
      } catch {
        continue;
      }
      const subs: __esri.Sublayer[] = [];
      const walk = (col?: __esri.Collection<__esri.Sublayer> | null) => {
        col?.forEach((s) => {
          if (!s.sublayers || s.sublayers.length === 0) subs.push(s);
          else walk(s.sublayers);
        });
      };
      walk(layer.sublayers);

      for (const sub of subs) {
        const title = sub.title ?? `Capa ${sub.id}`;
        if (!matchesOnlyLayers(cfg, sub.id, title)) continue;

        // El esquema de la subcapa se lee de la FeatureLayer equivalente.
        let fl: FeatureLayer;
        try {
          // createFeatureLayer devuelve FeatureLayer o Promise segun version.
          const created = (await Promise.resolve(
            sub.createFeatureLayer() as unknown,
          )) as FeatureLayer | null;
          if (!created) continue;
          fl = created;
          await fl.load();
        } catch {
          continue;
        }
        const field = findField(fl.fields, wanted);
        if (!field) continue;

        targets.push({
          title,
          field,
          queryLayer: fl,
          apply: (where) => {
            sub.definitionExpression = where;
          },
        });
      }
    }
  }

  return targets;
}

/** Valores distintos disponibles, unificando todas las capas afectadas. */
export async function collectFilterValues(
  targets: FilterTarget[],
  limitPerLayer = 2000,
): Promise<string[]> {
  const values = new Set<string>();

  const results = await Promise.allSettled(
    targets.map((target) =>
      safeQueryFeatures(target.queryLayer, {
        where: `${target.field} IS NOT NULL`,
        outFields: [target.field],
        returnDistinctValues: true,
        returnGeometry: false,
        orderByFields: [target.field],
        limit: limitPerLayer,
      }),
    ),
  );

  results.forEach((res, i) => {
    if (res.status !== 'fulfilled') return;
    const field = targets[i].field;
    for (const feature of res.value) {
      const raw = feature.attributes?.[field];
      if (raw != null && String(raw).trim() !== '') values.add(String(raw));
    }
  });

  return Array.from(values).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

/** Aplica los valores elegidos a todas las capas afectadas. */
export function applyFilter(targets: FilterTarget[], values: string[]): void {
  for (const target of targets) {
    target.apply(buildValueWhere(target.field, values));
  }
}

/** Retira el filtro de todas las capas afectadas. */
export function clearFilter(targets: FilterTarget[]): void {
  for (const target of targets) {
    target.apply('');
  }
}
