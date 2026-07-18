/**
 * Store central del mapa (RF-ARQ-01, seccion 3.2). Expone la instancia de
 * MapView/Map y el estado compartido para que cada modulo/herramienta sea
 * desacoplado: agregar o quitar una herramienta no obliga a modificar otras.
 */
import { create } from 'zustand';
import type MapView from '@arcgis/core/views/MapView';
import type EsriMap from '@arcgis/core/Map';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type Graphic from '@arcgis/core/Graphic';

/** Panel de herramienta activo en la barra lateral. */
export type ActiveTool =
  | 'search'
  | 'layers'
  | 'filter'
  | 'draw'
  | 'measure'
  | 'print'
  | 'goto'
  | 'selection'
  | null;

interface MapState {
  view: MapView | null;
  map: EsriMap | null;
  graphicsLayer: GraphicsLayer | null;
  sketchLayer: GraphicsLayer | null;
  featureLayers: FeatureLayer[];
  ready: boolean;

  activeTool: ActiveTool;
  selectedFeatures: Graphic[];

  setMapContext: (ctx: {
    view: MapView;
    map: EsriMap;
    graphicsLayer: GraphicsLayer;
    sketchLayer: GraphicsLayer;
    featureLayers: FeatureLayer[];
  }) => void;
  setReady: (ready: boolean) => void;
  setActiveTool: (tool: ActiveTool) => void;
  toggleTool: (tool: ActiveTool) => void;
  setSelectedFeatures: (features: Graphic[]) => void;
  reset: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  view: null,
  map: null,
  graphicsLayer: null,
  sketchLayer: null,
  featureLayers: [],
  ready: false,
  activeTool: 'layers',
  selectedFeatures: [],

  setMapContext: (ctx) =>
    set({
      view: ctx.view,
      map: ctx.map,
      graphicsLayer: ctx.graphicsLayer,
      sketchLayer: ctx.sketchLayer,
      featureLayers: ctx.featureLayers,
    }),
  setReady: (ready) => set({ ready }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleTool: (tool) => set({ activeTool: get().activeTool === tool ? null : tool }),
  setSelectedFeatures: (features) => set({ selectedFeatures: features }),
  reset: () =>
    set({
      view: null,
      map: null,
      graphicsLayer: null,
      sketchLayer: null,
      featureLayers: [],
      ready: false,
      selectedFeatures: [],
    }),
}));
