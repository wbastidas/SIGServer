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
import type Layer from '@arcgis/core/layers/Layer';
import type Graphic from '@arcgis/core/Graphic';

/** Elementos seleccionados agrupados por la capa de la que provienen. */
export interface SelectionGroup {
  title: string;
  features: Graphic[];
}

/** Panel de herramienta activo en la barra lateral. */
export type ActiveTool =
  | 'search'
  | 'layers'
  | 'basemap'
  | 'filter'
  | 'draw'
  | 'measure'
  | 'print'
  | 'goto'
  | 'selection'
  | 'table'
  | 'streetview'
  | null;

interface MapState {
  view: MapView | null;
  map: EsriMap | null;
  basemapLayer: Layer | null;
  graphicsLayer: GraphicsLayer | null;
  sketchLayer: GraphicsLayer | null;
  featureLayers: FeatureLayer[];
  ready: boolean;

  activeTool: ActiveTool;
  selectedFeatures: Graphic[];
  /** Seleccion agrupada por capa: permite saber de que capa es cada elemento. */
  selectionGroups: SelectionGroup[];

  setMapContext: (ctx: {
    view: MapView;
    map: EsriMap;
    basemapLayer: Layer;
    graphicsLayer: GraphicsLayer;
    sketchLayer: GraphicsLayer;
    featureLayers: FeatureLayer[];
  }) => void;
  setReady: (ready: boolean) => void;
  setActiveTool: (tool: ActiveTool) => void;
  toggleTool: (tool: ActiveTool) => void;
  setSelectedFeatures: (features: Graphic[]) => void;
  setSelection: (groups: SelectionGroup[]) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  view: null,
  map: null,
  basemapLayer: null,
  graphicsLayer: null,
  sketchLayer: null,
  featureLayers: [],
  ready: false,
  activeTool: 'layers',
  selectedFeatures: [],
  selectionGroups: [],

  setMapContext: (ctx) =>
    set({
      view: ctx.view,
      map: ctx.map,
      basemapLayer: ctx.basemapLayer,
      graphicsLayer: ctx.graphicsLayer,
      sketchLayer: ctx.sketchLayer,
      featureLayers: ctx.featureLayers,
    }),
  setReady: (ready) => set({ ready }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleTool: (tool) => set({ activeTool: get().activeTool === tool ? null : tool }),
  setSelectedFeatures: (features) =>
    set({ selectedFeatures: features, selectionGroups: [{ title: '', features }] }),
  setSelection: (groups) =>
    set({
      selectionGroups: groups,
      selectedFeatures: groups.flatMap((g) => g.features),
    }),
  clearSelection: () => set({ selectionGroups: [], selectedFeatures: [] }),
  reset: () =>
    set({
      view: null,
      map: null,
      basemapLayer: null,
      graphicsLayer: null,
      sketchLayer: null,
      featureLayers: [],
      ready: false,
      selectedFeatures: [],
      selectionGroups: [],
    }),
}));
