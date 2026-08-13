/**
 * Tipos de la configuracion externa (JSON) del visor.
 * Todo valor de servicio, capa, campo, SR, plantilla y busqueda vive en JSON
 * (RNF-CFG-01) y se tipa aqui para consumo seguro desde React/TypeScript.
 */

export type BasemapType = 'tiled' | 'dynamic';
export type OperationalMode = 'mapimage' | 'feature' | 'both';

export interface AppMeta {
  title: string;
  subtitle?: string;
  defaultLocale: string;
  defaultTheme: 'light' | 'dark';
}

export interface Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface MapConfig {
  /** URL del MapServer usado como mapa base (RF-MAP-01). */
  basemapUrl: string;
  /** 'tiled' -> TileLayer (cache); 'dynamic' -> MapImageLayer (export). */
  basemapType: BasemapType;
  /** URL del MapServer de redes electricas (RF-MAP-02). */
  operationalServiceUrl: string;
  /** Como cargar el servicio operacional. */
  operationalMode: OperationalMode;
  /** Si operationalMode incluye 'feature', que sublayers cargar como FeatureLayer. */
  featureSublayerIds?: number[];
  /** Sistema de referencia del mapa (RF-MAP-03). */
  spatialReferenceWkid: number;
  /**
   * Forzar el SR indicado aunque el mapa base sea una cache teselada.
   *
   * Una cache solo puede dibujarse en el SR de su propio esquema de teselas. Si
   * se fuerza otro SR distinto, el basemap no carga, la vista nunca queda
   * "ready" y el mapa deja de responder al zoom. Por eso el valor por defecto
   * es `false`: con basemap teselado manda el SR de la cache. Ponga `true` solo
   * si sabe que la cache esta publicada en `spatialReferenceWkid`.
   */
  forceSpatialReference?: boolean;
  /**
   * URL de un GeometryServer del ArcGIS Server para reproyecciones que requieran
   * transformacion de datum del lado servidor. Si se omite, el SDK usaria por
   * defecto el servicio de arcgisonline (AGOL); definir esta URL evita esa
   * dependencia externa (§2.1, §10.7). Ej.:
   * https://…/arcgis/rest/services/Utilities/Geometry/GeometryServer
   */
  geometryServiceUrl?: string;
  /** Extent inicial en el SR del mapa. Si viene en ceros se ignora. */
  initialExtent?: Extent;
  /** Centro inicial en Lat/Long (fallback si no hay initialExtent). */
  initialCenter?: { longitude: number; latitude: number };
  initialZoom?: number;
  /** Sublayers encendidas al arrancar (RF-LYR-04). */
  visibleLayerIds?: number[];
  minScale?: number;
  maxScale?: number;
}

export interface GotoConfig {
  /** WKIDs de entrada permitidos para "Ir a XY" (RF-GOTO-03). */
  allowedInputSR: number[];
  defaultInputSR: number;
  markerColor?: [number, number, number];
}

export interface FilterConfig {
  layerId: number;
  field: string;
  label?: string;
  allowMultiple: boolean;
}

export interface MeasureConfig {
  linearUnit: string;
  areaUnit: string;
}

export interface PrintConfig {
  printServiceUrl: string;
}

export interface StreetViewConfig {
  enabled: boolean;
  /** Referencia logica de la clave; el valor real viene de variable de entorno. */
  googleApiKeyRef?: string;
}

export interface AuthConfig {
  tokenExpirationMinutes: number;
  /** Si los servicios ArcGIS estan protegidos con token (RF-AUTH-05). */
  arcgisServerSecured: boolean;
  /** Base URL del backend de auth/proxy. Vacio = modo demo en cliente. */
  apiBaseUrl?: string;
}

/** Campo mostrado en la tabla de seleccion (RF-SEL-02). */
export interface SelectionFieldConfig {
  name: string;
  label?: string;
}

export interface SelectionConfig {
  /** Columnas por defecto para todas las capas. */
  fields: SelectionFieldConfig[];
  /** Mostrar de que capa proviene cada elemento seleccionado. */
  showLayerName?: boolean;
  /**
   * Columnas especificas por capa, para mostrar mas campos en ciertos
   * elementos sin cambiar el resto. La clave puede ser el nombre de la capa
   * (como aparece en el servicio) o su id de subcapa. Ej.:
   *   "fieldsByLayer": {
   *     "Transformadores": [
   *       { "name": "OBJECTID" },
   *       { "name": "TRAFO", "label": "Codigo TRAFO" }
   *     ],
   *     "9": [ { "name": "OBJECTID" } ]
   *   }
   */
  fieldsByLayer?: Record<string, SelectionFieldConfig[]>;
}

export interface AppConfig {
  app: AppMeta;
  map: MapConfig;
  goto: GotoConfig;
  selection?: SelectionConfig;
  filters: FilterConfig[];
  measure: MeasureConfig;
  print: PrintConfig;
  streetView: StreetViewConfig;
  auth: AuthConfig;
}

/* ----------------------------- Busquedas -------------------------------- */

export type SearchOperator = 'LIKE' | '=';

/** Busqueda directa sobre una capa espacial (RF-SRC-02). */
export interface LayerSearch {
  id: string;
  label: string;
  type: 'layer';
  url: string;
  searchField: string;
  operator: SearchOperator;
  caseInsensitive?: boolean;
  outFields: string[];
  displayField: string;
  returnGeometry?: boolean;
  suggestions?: boolean;
  zoomScale?: number;
}

export type RelationMode = 'relationshipId' | 'join';

export interface RelationConfig {
  mode: RelationMode;
  /** Requerido cuando mode = 'relationshipId'. */
  relationshipId?: number;
  /** Capa espacial destino donde ubicar el elemento relacionado. */
  targetLayerUrl: string;
  /** Campo llave en el origen (requerido cuando mode = 'join'). */
  keyField?: string;
  /** Campo llave en el destino (requerido cuando mode = 'join'). */
  targetKeyField?: string;
}

/** Busqueda sobre tabla no espacial resolviendo el elemento relacionado (RF-SRC-03/04). */
export interface RelatedTableSearch {
  id: string;
  label: string;
  type: 'relatedTable';
  source: {
    url: string;
    searchField: string;
    operator: SearchOperator;
    caseInsensitive?: boolean;
  };
  relation: RelationConfig;
  outFields: string[];
  returnGeometry?: boolean;
  suggestions?: boolean;
  zoomScale?: number;
}

export type SearchDefinition = LayerSearch | RelatedTableSearch;

export interface SearchesConfig {
  searches: SearchDefinition[];
}

/* ------------------------------- Popups --------------------------------- */

export interface PopupFieldConfig {
  name: string;
  label?: string;
  format?: 'number' | 'date' | 'text';
}

export interface PopupRelatedConfig {
  mode: RelationMode;
  relationshipId?: number;
  /** Para join: URL de la capa/tabla relacionada. */
  relatedUrl?: string;
  keyField?: string;
  targetKeyField?: string;
  label: string;
}

export interface PopupLayerConfig {
  layerId: number;
  title: string;
  fields: PopupFieldConfig[];
  related?: PopupRelatedConfig[];
  streetView?: boolean;
}

export interface PopupsConfig {
  popups: PopupLayerConfig[];
}

/** Configuracion completa cargada al arranque. */
export interface FullConfig {
  app: AppConfig;
  searches: SearchDefinition[];
  popups: PopupLayerConfig[];
}
