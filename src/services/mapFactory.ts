/**
 * Fabrica de mapa y capas a partir de la configuracion (RF-MAP-01/02/03).
 * Consume EXCLUSIVAMENTE servicios de ArcGIS Server (sin AGOL/Portal).
 */
import EsriMap from '@arcgis/core/Map';
import Basemap from '@arcgis/core/Basemap';
import TileLayer from '@arcgis/core/layers/TileLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import type { AppConfig, PopupLayerConfig } from '@/types/config';
import { buildPopupTemplate, buildDefaultPopupTemplate } from './popupTemplateFactory';

export interface BuiltMap {
  map: EsriMap;
  basemapLayer: Layer;
  operationalLayers: Layer[];
  featureLayers: FeatureLayer[];
  graphicsLayer: GraphicsLayer;
  sketchLayer: GraphicsLayer;
}

/**
 * Crea el mapa base (RF-MAP-01) segun sea cache teselado o dinamico.
 *
 * Si se configuro "tiled" pero el servicio en realidad es dinamico, el TileLayer
 * falla al cargar y la vista se queda sin cartografia (y sin esquema de teselas).
 * Para que el visor siga siendo usable se sustituye automaticamente por un
 * MapImageLayer (SRS §10.1: validar el tipo de publicacion de CartografiaN).
 */
function createBasemapLayer(cfg: AppConfig, basemap: Basemap): Layer {
  const { basemapUrl, basemapType } = cfg.map;
  if (basemapType !== 'tiled') {
    return new MapImageLayer({ url: basemapUrl, title: 'Cartografia base' });
  }

  const tiled = new TileLayer({ url: basemapUrl, title: 'Cartografia base' });
  tiled.load().catch(() => {
    console.warn(
      '[mapFactory] El basemap configurado como "tiled" no se pudo cargar; ' +
        'se usa MapImageLayer (revise map.basemapType en app-config.json).',
    );
    const fallback = new MapImageLayer({ url: basemapUrl, title: 'Cartografia base' });
    basemap.baseLayers.removeAll();
    basemap.baseLayers.add(fallback);
  });
  return tiled;
}

/** Crea las capas operacionales de red (RF-MAP-02). */
function createOperationalLayers(
  cfg: AppConfig,
  popups: PopupLayerConfig[],
): { operational: Layer[]; features: FeatureLayer[] } {
  const { operationalServiceUrl, operationalMode, featureSublayerIds, visibleLayerIds } = cfg.map;
  const operational: Layer[] = [];
  const features: FeatureLayer[] = [];

  const wantMapImage = operationalMode === 'mapimage' || operationalMode === 'both';
  const wantFeature = operationalMode === 'feature' || operationalMode === 'both';

  if (wantMapImage) {
    const mil = new MapImageLayer({
      url: operationalServiceUrl,
      title: 'Redes electricas',
    });
    mil.when(() => {
      const applyVisibility = !!visibleLayerIds && visibleLayerIds.length > 0;
      // Recorre TODAS las sublayers (incluidas las anidadas en grupos):
      // popups siempre (RF-POP-03); visibilidad solo si el JSON la define
      // (RF-LYR-04), dejando los grupos con su visibilidad por defecto.
      const walk = (subs?: __esri.Collection<__esri.Sublayer> | null) => {
        subs?.forEach((sub) => {
          const isGroup = !!sub.sublayers && sub.sublayers.length > 0;
          const popupCfg = popups.find((p) => p.layerId === sub.id);
          if (!isGroup) {
            // Con configuracion se usa la del JSON; sin ella, una plantilla por
            // defecto con todos los campos, para que SIEMPRE haya popup al clic.
            sub.popupTemplate = popupCfg
              ? buildPopupTemplate(popupCfg, cfg)
              : buildDefaultPopupTemplate(sub.title ?? `Capa ${sub.id}`, cfg);
          }
          if (applyVisibility && !isGroup) {
            sub.visible = visibleLayerIds!.includes(sub.id);
          }
          walk(sub.sublayers);
        });
      };
      walk(mil.sublayers);
    });
    operational.push(mil);
  }

  if (wantFeature && featureSublayerIds) {
    for (const id of featureSublayerIds) {
      const popupCfg = popups.find((p) => p.layerId === id);
      const fl = new FeatureLayer({
        url: `${operationalServiceUrl}/${id}`,
        outFields: ['*'],
        popupEnabled: true,
        popupTemplate: popupCfg ? buildPopupTemplate(popupCfg, cfg) : undefined,
        visible: !visibleLayerIds || visibleLayerIds.includes(id),
      });
      operational.push(fl);
      features.push(fl);
    }
  }

  return { operational, features };
}

export function buildMap(cfg: AppConfig, popups: PopupLayerConfig[]): BuiltMap {
  const basemap = new Basemap({ baseLayers: [], title: 'Base' });
  const basemapLayer = createBasemapLayer(cfg, basemap);
  basemap.baseLayers.add(basemapLayer);

  const { operational, features } = createOperationalLayers(cfg, popups);

  // Capa dedicada para dibujo del usuario (RF-DRW-04) y otra para
  // graficos temporales (marcadores de busqueda, ir a XY, resaltados).
  const sketchLayer = new GraphicsLayer({ title: 'Dibujo', listMode: 'hide' });
  const graphicsLayer = new GraphicsLayer({ title: 'Temporales', listMode: 'hide' });

  const map = new EsriMap({
    basemap,
    layers: [...operational, sketchLayer, graphicsLayer],
  });

  return {
    map,
    basemapLayer,
    operationalLayers: operational,
    featureLayers: features,
    graphicsLayer,
    sketchLayer,
  };
}
