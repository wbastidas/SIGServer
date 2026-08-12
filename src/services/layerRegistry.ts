/**
 * Registro de capas consultables del mapa.
 *
 * Problema que resuelve: cuando el servicio operacional se carga como
 * `MapImageLayer` (map.operationalMode = "mapimage"), el mapa NO contiene
 * ninguna `FeatureLayer`, por lo que la seleccion espacial, la tabla de
 * atributos y el "zoom a la capa" se quedaban sin fuentes y no devolvian nada.
 *
 * Aqui se normalizan ambos casos a una lista de `FeatureLayer` consultables:
 *  - Las `FeatureLayer` que ya estan en el mapa.
 *  - Las subcapas de cada `MapImageLayer`, convertidas con
 *    `Sublayer.createFeatureLayer()` (misma URL/servicio, sin dibujarse en el
 *    mapa: solo se usan para consultar).
 */
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import type EsriMap from '@arcgis/core/Map';

export interface QueryableLayer {
  /** Identificador estable (url del servicio + id de subcapa). */
  id: string;
  title: string;
  layer: FeatureLayer;
  /** true si proviene de una subcapa de MapImageLayer. */
  fromSublayer: boolean;
  /** Visibilidad efectiva en el mapa (para filtrar "solo lo visible"). */
  visible: boolean;
}

/** Cache para no recrear FeatureLayers en cada consulta. */
const sublayerCache = new Map<string, FeatureLayer>();

function isLeaf(sub: __esri.Sublayer): boolean {
  return !sub.sublayers || sub.sublayers.length === 0;
}

/** Recorre subcapas (incluidas las anidadas en grupos) y devuelve las hojas. */
function collectLeafSublayers(layer: MapImageLayer): __esri.Sublayer[] {
  const out: __esri.Sublayer[] = [];
  const walk = (subs?: __esri.Collection<__esri.Sublayer> | null) => {
    subs?.forEach((sub) => {
      if (isLeaf(sub)) out.push(sub);
      else walk(sub.sublayers);
    });
  };
  walk(layer.sublayers);
  return out;
}

/** Visible teniendo en cuenta la capa contenedora y los grupos padre. */
function sublayerVisible(sub: __esri.Sublayer, parent: MapImageLayer): boolean {
  if (!parent.visible) return false;
  let cur: __esri.Sublayer | null | undefined = sub;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent && 'visible' in cur.parent ? (cur.parent as __esri.Sublayer) : null;
  }
  return true;
}

/**
 * Devuelve todas las capas consultables del mapa. Espera a que las capas
 * carguen para poder leer sus subcapas y capacidades.
 */
export async function getQueryableLayers(
  map: EsriMap | null | undefined,
): Promise<QueryableLayer[]> {
  if (!map) return [];
  const result: QueryableLayer[] = [];

  for (const layer of map.layers.toArray()) {
    if (layer.listMode === 'hide') continue;

    if (layer instanceof FeatureLayer) {
      try {
        await layer.load();
      } catch {
        continue;
      }
      result.push({
        id: layer.url ?? layer.id,
        title: layer.title ?? 'Capa',
        layer,
        fromSublayer: false,
        visible: layer.visible,
      });
      continue;
    }

    if (layer instanceof MapImageLayer) {
      try {
        await layer.load();
      } catch {
        continue;
      }
      for (const sub of collectLeafSublayers(layer)) {
        const key = `${layer.url}/${sub.id}`;
        let fl = sublayerCache.get(key);
        if (!fl) {
          try {
            // createFeatureLayer puede devolver FeatureLayer o Promise segun version.
            fl = await Promise.resolve(sub.createFeatureLayer() as FeatureLayer | Promise<FeatureLayer>);
            await fl.load();
            sublayerCache.set(key, fl);
          } catch {
            continue; // subcapa sin soporte de consulta (p. ej. raster)
          }
        }
        result.push({
          id: key,
          title: sub.title ?? `Subcapa ${sub.id}`,
          layer: fl,
          fromSublayer: true,
          visible: sublayerVisible(sub, layer),
        });
      }
    }
  }

  return result;
}

/** Solo las capas actualmente visibles en el mapa. */
export function onlyVisible(layers: QueryableLayer[]): QueryableLayer[] {
  return layers.filter((l) => l.visible);
}

/** Limpia la cache (util al reconstruir el mapa). */
export function clearLayerRegistryCache(): void {
  sublayerCache.clear();
}
