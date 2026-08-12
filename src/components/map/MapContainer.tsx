/**
 * Contenedor del mapa (MapContainer). Crea Map + MapView con @arcgis/core,
 * respeta el SR configurable (RF-MAP-03) y publica el contexto en el store
 * central (RF-ARQ-01). Tambien enlaza la accion de Street View del popup
 * (RF-POP-04 -> RF-GSV).
 */
import { useEffect, useRef } from 'react';
import MapView from '@arcgis/core/views/MapView';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import Extent from '@arcgis/core/geometry/Extent';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import esriConfig from '@arcgis/core/config';
import { buildMap } from '@/services/mapFactory';
import { STREET_VIEW_ACTION_ID } from '@/services/popupTemplateFactory';
import { toLatLong, pointFromLatLong } from '@/services/projectionService';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import './map.css';

// Assets locales del SDK copiados al bundle (ver vite.config.ts) para
// funcionar sin CDN externo (100% autocontenido en IIS).
esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useConfigStore((s) => s.config);
  const setMapContext = useMapStore((s) => s.setMapContext);
  const setReady = useMapStore((s) => s.setReady);
  const openStreetView = useStreetViewStore((s) => s.openAt);

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const appCfg = config.app;

    // Evita la dependencia externa a AGOL: usa el GeometryServer del ArcGIS Server
    // propio para reproyecciones que requieran transformacion del lado servidor.
    if (appCfg.map.geometryServiceUrl) {
      esriConfig.geometryServiceUrl = appCfg.map.geometryServiceUrl;
    }

    const built = buildMap(appCfg, config.popups);
    const spatialReference = new SpatialReference({ wkid: appCfg.map.spatialReferenceWkid });

    const hasExtent =
      appCfg.map.initialExtent &&
      (appCfg.map.initialExtent.xmax !== 0 || appCfg.map.initialExtent.ymax !== 0);

    const view = new MapView({
      container: containerRef.current,
      map: built.map,
      spatialReference,
      constraints: {
        minScale: appCfg.map.minScale || undefined,
        maxScale: appCfg.map.maxScale || undefined,
        rotationEnabled: false,
      },
      popup: {
        dockEnabled: true,
        dockOptions: { buttonEnabled: true, breakpoint: false, position: 'top-right' },
      },
      ...(hasExtent
        ? { extent: new Extent({ ...appCfg.map.initialExtent!, spatialReference }) }
        : { zoom: appCfg.map.initialZoom }),
    });

    // Encuadre inicial cuando no hay initialExtent.
    // IMPORTANTE: `initialCenter` viene en Lat/Long (WGS84) y el mapa puede estar
    // en otro SR (p. ej. UTM 32717). Pasar [long, lat] tal cual a la vista hace
    // que se interpreten como coordenadas del SR del mapa y el visor arranque a
    // miles de kilometros de los datos (por eso "no se podia hacer zoom a la
    // capa de redes"). Se reproyecta antes de centrar; si no hay centro
    // configurado, se encuadra la extension real del servicio de redes.
    if (!hasExtent) {
      void (async () => {
        try {
          if (appCfg.map.initialCenter) {
            const center = await pointFromLatLong(
              appCfg.map.initialCenter.latitude,
              appCfg.map.initialCenter.longitude,
              appCfg.map.spatialReferenceWkid,
            );
            if (view.destroyed) return;
            await view.goTo({ target: center, zoom: appCfg.map.initialZoom ?? 12 });
          } else {
            const operational = built.operationalLayers[0];
            await operational?.load();
            if (view.destroyed || !operational?.fullExtent) return;
            await view.goTo(operational.fullExtent);
          }
        } catch {
          /* encuadre best-effort: si falla se queda en la vista por defecto */
        }
      })();
    }

    // Quitar el widget de zoom por defecto: usaremos el componente Calcite arcgis-zoom.
    view.ui.remove('zoom');
    view.ui.move('attribution', 'bottom-right');

    view.when(() => {
      setMapContext({
        view,
        map: built.map,
        basemapLayer: built.basemapLayer,
        graphicsLayer: built.graphicsLayer,
        sketchLayer: built.sketchLayer,
        featureLayers: built.featureLayers,
      });
      setReady(true);
    });

    // RF-POP-04 -> RF-GSV: accion Street View dentro del popup.
    const actionHandle = reactiveUtils.on(
      () => view.popup,
      'trigger-action',
      async (event: any) => {
        if (event.action?.id !== STREET_VIEW_ACTION_ID) return;
        const feature = view.popup?.selectedFeature;
        const geometry = feature?.geometry as __esri.Point | __esri.Geometry | undefined;
        if (!geometry) return;
        const point =
          geometry.type === 'point'
            ? (geometry as __esri.Point)
            : (geometry as any).extent?.center ?? (geometry as any).centroid;
        if (!point) return;
        const { latitude, longitude } = await toLatLong(point);
        openStreetView(latitude, longitude);
      },
    );

    return () => {
      actionHandle?.remove();
      setReady(false);
      view.destroy();
    };
  }, [config, setMapContext, setReady, openStreetView]);

  return <div ref={containerRef} className="map-view" />;
}
