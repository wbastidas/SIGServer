/**
 * Internacionalizacion (RNF-UX-04). Diccionarios completos es-EC (por defecto) y
 * en-US. Para agregar un idioma, añada una entrada a `dictionaries`. Los
 * componentes consumen las cadenas con el hook `useI18n().t(key, params?)`.
 * Soporta interpolacion simple con marcadores {nombre}.
 */
export type LocaleKey =
  // App / navegacion
  | 'app.exit'
  | 'app.themeLight'
  | 'app.themeDark'
  // Comunes
  | 'common.clear'
  | 'common.apply'
  | 'common.loading'
  | 'common.retry'
  // Login
  | 'login.user'
  | 'login.password'
  | 'login.submit'
  | 'login.demoHint'
  // Herramientas (barra)
  | 'tool.search'
  | 'tool.layers'
  | 'tool.basemap'
  | 'tool.filter'
  | 'tool.selection'
  | 'tool.draw'
  | 'tool.measure'
  | 'tool.goto'
  | 'tool.print'
  // Titulos de panel
  | 'panel.search'
  | 'panel.layers'
  | 'panel.basemap'
  | 'panel.filter'
  | 'panel.selection'
  | 'panel.draw'
  | 'panel.measure'
  | 'panel.goto'
  | 'panel.print'
  // Busqueda
  | 'search.type'
  | 'search.term'
  | 'search.termPlaceholder'
  | 'search.results'
  | 'search.noGeometry'
  | 'search.noConfig'
  // Capas
  | 'layers.opacity'
  | 'layers.loading'
  | 'layers.legend'
  // Mapa base
  | 'basemap.type'
  | 'basemap.tiled'
  | 'basemap.dynamic'
  | 'basemap.visible'
  | 'basemap.opacity'
  // Filtros
  | 'filter.layerField'
  | 'filter.multiple'
  | 'filter.single'
  | 'filter.loadingValues'
  | 'filter.valuesCount'
  | 'filter.noConfig'
  // Dibujo
  | 'draw.help'
  // Medicion
  | 'measure.distance'
  | 'measure.area'
  | 'measure.clear'
  // Ir a XY / LatLong
  | 'goto.inputSR'
  | 'goto.latlong'
  | 'goto.projected'
  | 'goto.longitudeX'
  | 'goto.xEast'
  | 'goto.latitudeY'
  | 'goto.yNorth'
  | 'goto.go'
  | 'goto.errNumeric'
  | 'goto.errLat'
  | 'goto.errLong'
  | 'goto.errNav'
  // Seleccion / tabla
  | 'selection.click'
  | 'selection.rectangle'
  | 'selection.polygon'
  | 'selection.count'
  | 'selection.hintNoFeature'
  | 'selection.csv'
  | 'selection.goTo'
  // Impresion
  | 'print.noService'
  | 'print.help'
  // Street View
  | 'sv.title'
  | 'sv.loading'
  | 'sv.noCoverage'
  | 'sv.unavailable'
  | 'sv.close';

type Dictionary = Record<LocaleKey, string>;

const esEC: Dictionary = {
  'app.exit': 'Salir',
  'app.themeLight': 'Claro',
  'app.themeDark': 'Oscuro',

  'common.clear': 'Limpiar',
  'common.apply': 'Aplicar',
  'common.loading': 'Cargando...',
  'common.retry': 'Reintentar',

  'login.user': 'Usuario',
  'login.password': 'Contrasena',
  'login.submit': 'Ingresar',
  'login.demoHint':
    'Modo demo: use admin / admin. Configure un backend de autenticacion para produccion.',

  'tool.search': 'Buscar',
  'tool.layers': 'Capas y leyenda',
  'tool.basemap': 'Mapa base',
  'tool.filter': 'Filtros',
  'tool.selection': 'Seleccion / Tabla',
  'tool.draw': 'Dibujo',
  'tool.measure': 'Medicion',
  'tool.goto': 'Ir a XY / LatLong',
  'tool.print': 'Imprimir',

  'panel.search': 'Busqueda',
  'panel.layers': 'Capas y leyenda',
  'panel.basemap': 'Mapa base',
  'panel.filter': 'Filtros',
  'panel.selection': 'Seleccion y tabla',
  'panel.draw': 'Dibujo',
  'panel.measure': 'Medicion',
  'panel.goto': 'Ir a una ubicacion',
  'panel.print': 'Impresion',

  'search.type': 'Tipo de busqueda',
  'search.term': 'Texto a buscar',
  'search.termPlaceholder': 'Ingrese un valor...',
  'search.results': '{n} resultado(s). Haga clic para ubicar en el mapa.',
  'search.noGeometry': '(sin geometria)',
  'search.noConfig': 'No hay busquedas configuradas en searches.json.',

  'layers.opacity': 'Opacidad por capa',
  'layers.loading': 'Cargando capas...',
  'layers.legend': 'Leyenda',

  'basemap.type': 'Tipo de publicacion',
  'basemap.tiled': 'Teselado (cache)',
  'basemap.dynamic': 'Dinamico (export)',
  'basemap.visible': 'Visible',
  'basemap.opacity': 'Opacidad',

  'filter.layerField': 'Capa / campo',
  'filter.multiple': 'Seleccion multiple (IN)',
  'filter.single': 'Seleccion individual',
  'filter.loadingValues': 'cargando valores...',
  'filter.valuesCount': '{n} valores',
  'filter.noConfig': 'No hay filtros configurados en app-config.json.',

  'draw.help':
    'Dibuje puntos, lineas, poligonos, rectangulos y circulos. Puede mover, editar y borrar geometrias. Use "Limpiar todo" en la herramienta.',

  'measure.distance': 'Distancia',
  'measure.area': 'Area',
  'measure.clear': 'Limpiar medicion',

  'goto.inputSR': 'Sistema de referencia de entrada',
  'goto.latlong': 'Lat/Long (WGS84 · 4326)',
  'goto.projected': 'Proyectado (WKID {wkid})',
  'goto.longitudeX': 'Longitud (X)',
  'goto.xEast': 'X (Este)',
  'goto.latitudeY': 'Latitud (Y)',
  'goto.yNorth': 'Y (Norte)',
  'goto.go': 'Ir a la ubicacion',
  'goto.errNumeric': 'Ingrese coordenadas numericas validas.',
  'goto.errLat': 'Latitud fuera de rango (-90 a 90).',
  'goto.errLong': 'Longitud fuera de rango (-180 a 180).',
  'goto.errNav': 'No se pudo navegar: {msg}',

  'selection.click': 'Clic',
  'selection.rectangle': 'Rectangulo',
  'selection.polygon': 'Poligono',
  'selection.count': '{n} elemento(s) seleccionado(s).',
  'selection.hintNoFeature':
    'Nota: configure capas como FeatureLayer (map.operationalMode) para seleccion espacial.',
  'selection.csv': 'CSV',
  'selection.goTo': 'Ir al elemento',

  'print.noService':
    'No hay servicio de impresion configurado (print.printServiceUrl en app-config.json).',
  'print.help':
    'Elija plantilla, formato (PDF/PNG/JPG), titulo y escala. La leyenda de las capas visibles se incluye segun soporte del servicio.',

  'sv.title': 'Google Street View',
  'sv.loading': 'Cargando panoramica...',
  'sv.noCoverage': 'No hay cobertura de Street View en este punto.',
  'sv.unavailable':
    'Street View no disponible: falta la clave de Google (VITE_GOOGLE_MAPS_KEY) o no hay conexion a internet.',
  'sv.close': 'Cerrar',
};

const enUS: Dictionary = {
  'app.exit': 'Sign out',
  'app.themeLight': 'Light',
  'app.themeDark': 'Dark',

  'common.clear': 'Clear',
  'common.apply': 'Apply',
  'common.loading': 'Loading...',
  'common.retry': 'Retry',

  'login.user': 'User',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.demoHint': 'Demo mode: use admin / admin. Configure an auth backend for production.',

  'tool.search': 'Search',
  'tool.layers': 'Layers & legend',
  'tool.basemap': 'Basemap',
  'tool.filter': 'Filters',
  'tool.selection': 'Selection / Table',
  'tool.draw': 'Draw',
  'tool.measure': 'Measure',
  'tool.goto': 'Go to XY / LatLong',
  'tool.print': 'Print',

  'panel.search': 'Search',
  'panel.layers': 'Layers & legend',
  'panel.basemap': 'Basemap',
  'panel.filter': 'Filters',
  'panel.selection': 'Selection & table',
  'panel.draw': 'Draw',
  'panel.measure': 'Measure',
  'panel.goto': 'Go to a location',
  'panel.print': 'Print',

  'search.type': 'Search type',
  'search.term': 'Text to search',
  'search.termPlaceholder': 'Enter a value...',
  'search.results': '{n} result(s). Click to locate on the map.',
  'search.noGeometry': '(no geometry)',
  'search.noConfig': 'No searches configured in searches.json.',

  'layers.opacity': 'Opacity per layer',
  'layers.loading': 'Loading layers...',
  'layers.legend': 'Legend',

  'basemap.type': 'Publication type',
  'basemap.tiled': 'Tiled (cache)',
  'basemap.dynamic': 'Dynamic (export)',
  'basemap.visible': 'Visible',
  'basemap.opacity': 'Opacity',

  'filter.layerField': 'Layer / field',
  'filter.multiple': 'Multiple selection (IN)',
  'filter.single': 'Single selection',
  'filter.loadingValues': 'loading values...',
  'filter.valuesCount': '{n} values',
  'filter.noConfig': 'No filters configured in app-config.json.',

  'draw.help':
    'Draw points, lines, polygons, rectangles and circles. You can move, edit and delete geometries. Use "Clear all" in the tool.',

  'measure.distance': 'Distance',
  'measure.area': 'Area',
  'measure.clear': 'Clear measurement',

  'goto.inputSR': 'Input spatial reference',
  'goto.latlong': 'Lat/Long (WGS84 · 4326)',
  'goto.projected': 'Projected (WKID {wkid})',
  'goto.longitudeX': 'Longitude (X)',
  'goto.xEast': 'X (East)',
  'goto.latitudeY': 'Latitude (Y)',
  'goto.yNorth': 'Y (North)',
  'goto.go': 'Go to location',
  'goto.errNumeric': 'Enter valid numeric coordinates.',
  'goto.errLat': 'Latitude out of range (-90 to 90).',
  'goto.errLong': 'Longitude out of range (-180 to 180).',
  'goto.errNav': 'Could not navigate: {msg}',

  'selection.click': 'Click',
  'selection.rectangle': 'Rectangle',
  'selection.polygon': 'Polygon',
  'selection.count': '{n} selected feature(s).',
  'selection.hintNoFeature':
    'Note: configure layers as FeatureLayer (map.operationalMode) for spatial selection.',
  'selection.csv': 'CSV',
  'selection.goTo': 'Go to feature',

  'print.noService':
    'No print service configured (print.printServiceUrl in app-config.json).',
  'print.help':
    'Choose template, format (PDF/PNG/JPG), title and scale. The legend of visible layers is included depending on the service.',

  'sv.title': 'Google Street View',
  'sv.loading': 'Loading panorama...',
  'sv.noCoverage': 'No Street View coverage at this point.',
  'sv.unavailable':
    'Street View unavailable: missing Google key (VITE_GOOGLE_MAPS_KEY) or no internet connection.',
  'sv.close': 'Close',
};

export const dictionaries: Record<string, Dictionary> = {
  'es-EC': esEC,
  es: esEC,
  'en-US': enUS,
  en: enUS,
};

export const DEFAULT_LOCALE = 'es-EC';

export type TranslateParams = Record<string, string | number>;

function interpolate(text: string, params?: TranslateParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] != null ? String(params[key]) : `{${key}}`,
  );
}

export function translate(locale: string, key: LocaleKey, params?: TranslateParams): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const text = dict[key] ?? esEC[key] ?? key;
  return interpolate(text, params);
}
