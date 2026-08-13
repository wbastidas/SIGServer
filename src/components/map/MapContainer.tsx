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
import { buildViewOptions, zoomToScale } from '@/services/viewOptions';
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

    const viewOptions = buildViewOptions(appCfg.map);

    // Con un mapa base teselado, la cache impone su propio esquema de teselas:
    // forzar otro SR impide que cargue y deja la vista sin inicializar (el mapa
    // se queda sin responder al zoom). Por eso solo se fija el SR cuando el
    // basemap es dinamico o cuando se pide expresamente con
    // `map.forceSpatialReference` (ver types/config.ts).
    const applySR =
      appCfg.map.basemapType !== 'tiled' || appCfg.map.forceSpatialReference === true;

    const view = new MapView({
      container: containerRef.current,
      map: built.map,
      ...(applySR ? { spatialReference } : {}),
      constraints: viewOptions.constraints,
      popup: {
        // Acoplado SIEMPRE al lateral derecho, nunca flotando sobre el punto ni
        // anclado abajo: con `breakpoint: false` no se reubica solo en pantallas
        // pequenas, de modo que la informacion aparece en el mismo sitio en
        // escritorio, tablet y movil.
        dockEnabled: true,
        dockOptions: { buttonEnabled: false, breakpoint: false, position: 'top-right' },
      },
      // `scale` (a diferencia de `zoom`) no depende de que existan LODs.
      scale: viewOptions.scale ?? zoomToScale(appCfg.map.initialZoom),
    });

    // Encuadre inicial, ya con la vista creada (goTo reproyecta si hace falta).
    //
    // IMPORTANTE: `initialCenter` viene en Lat/Long (WGS84) y el mapa puede
    // estar en otro SR (p. ej. UTM 32717). Pasar [long, lat] tal cual haria que
    // se interpretaran como coordenadas del SR del mapa y el visor arrancaria a
    // miles de kilometros de los datos. Se reproyecta al SR REAL de la vista
    // (que puede venir impuesto por la cache del basemap).
    void (async () => {
      try {
        await view.when();
        if (view.destroyed) return;
        const viewWkid = view.spatialReference?.wkid ?? appCfg.map.spatialReferenceWkid;

        if (hasExtent) {
          await view.goTo(
            new Extent({
              ...appCfg.map.initialExtent!,
              spatialReference: new SpatialReference({ wkid: appCfg.map.spatialReferenceWkid }),
            }),
          );
          return;
        }
        if (appCfg.map.initialCenter) {
          const center = await pointFromLatLong(
            appCfg.map.initialCenter.latitude,
            appCfg.map.initialCenter.longitude,
            viewWkid,
          );
          if (view.destroyed) return;
          await view.goTo({ target: center, scale: zoomToScale(appCfg.map.initialZoom) });
          return;
        }
        // Sin centro configurado: encuadra la extension real del servicio.
        const operational = built.operationalLayers[0];
        await operational?.load();
        if (view.destroyed || !operational?.fullExtent) return;
        await view.goTo(operational.fullExtent);
      } catch {
        /* encuadre best-effort: si falla se queda en la vista por defecto */
      }
    })();

    // Quitar el widget de zoom por defecto: usamos controles propios (MapControls).
    view.ui.remove('zoom');
    view.ui.move('attribution', 'bottom-right');

    // La vista se publica en el store NADA MAS crearla, sin esperar a view.when().
    // Asi los controles de zoom y las herramientas quedan operativos aunque una
    // capa del servicio falle al cargar; `ready` sigue reflejando la carga real.
    setMapContext({
      view,
      map: built.map,
      basemapLayer: built.basemapLayer,
      graphicsLayer: built.graphicsLayer,
      sketchLayer: built.sketchLayer,
      featureLayers: built.featureLayers,
    });

    view.when(
      () => setReady(true),
      () => setReady(false),
    );

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
