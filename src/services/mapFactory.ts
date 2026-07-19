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
import { buildPopupTemplate } from './popupTemplateFactory';

export interface BuiltMap {
  map: EsriMap;
  basemapLayer: Layer;
  operationalLayers: Layer[];
  featureLayers: FeatureLayer[];
  graphicsLayer: GraphicsLayer;
  sketchLayer: GraphicsLayer;
}

/** Crea el mapa base (RF-MAP-01) segun sea cache teselado o dinamico. */
function createBasemapLayer(cfg: AppConfig): Layer {
  const { basemapUrl, basemapType } = cfg.map;
  if (basemapType === 'tiled') {
    return new TileLayer({ url: basemapUrl, title: 'Cartografia base' });
  }
  return new MapImageLayer({ url: basemapUrl, title: 'Cartografia base' });
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
          if (popupCfg) {
            sub.popupTemplate = buildPopupTemplate(popupCfg, cfg);
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
  const basemapLayer = createBasemapLayer(cfg);
  const basemap = new Basemap({ baseLayers: [basemapLayer], title: 'Base' });

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
