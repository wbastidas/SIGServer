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
  | 'map.zoomIn'
  | 'map.zoomOut'
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
  | 'filter.values'
  | 'filter.searchValues'
  | 'filter.searchPlaceholder'
  | 'filter.noMatches'
  | 'filter.tooMany'
  // Seleccion / tabla acoplada
  | 'selection.layer'
  | 'selection.dock'
  | 'selection.hintClick'
  | 'selection.hintDraw'
  | 'selection.viewTable'
  | 'selection.emptyHint'
  | 'table.resize'
  | 'selection.collapse'
  | 'selection.expand'
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
  | 'selection.querying'
  | 'selection.noResults'
  // Tabla de atributos
  | 'tool.table'
  | 'panel.table'
  | 'table.layer'
  | 'table.scopeVisible'
  | 'table.scopeAll'
  | 'table.noLayers'
  | 'table.loading'
  | 'table.hintVisible'
  | 'table.hintAll'
  // Zoom a capa
  | 'layers.zoomTo'
  | 'layers.zoomToTitle'
  | 'layers.noExtent'
  // Impresion
  | 'print.noService'
  | 'print.help'
  // Street View
  | 'sv.title'
  | 'sv.loading'
  | 'sv.noCoverage'
  | 'sv.unavailable'
  | 'sv.close'
  | 'sv.popupBlocked'
  | 'sv.openInGoogle'
  | 'sv.pickOnMap'
  | 'sv.pickOnMapActive'
  | 'sv.pickHint'
  | 'sv.noKeyHint'
  | 'tool.streetView'
  | 'panel.streetView';

type Dictionary = Record<LocaleKey, string>;

const esEC: Dictionary = {
  'app.exit': 'Salir',
  'app.themeLight': 'Claro',
  'app.themeDark': 'Oscuro',
  'map.zoomIn': 'Acercar',
  'map.zoomOut': 'Alejar',

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
  'filter.values': 'Valores',
  'filter.searchValues': 'Buscar valor',
  'filter.searchPlaceholder': 'Escriba para filtrar la lista...',
  'filter.noMatches': 'Ningun valor coincide con la busqueda.',
  'filter.tooMany': 'Mostrando los primeros 300 de {n}. Afine la busqueda.',

  'selection.layer': 'Capa',
  'selection.dock': 'Tabla',
  'selection.hintClick': 'Haga clic sobre un elemento del mapa para seleccionarlo.',
  'selection.hintDraw': 'Dibuje un area sobre el mapa para seleccionar los elementos que contiene.',
  'selection.viewTable': 'Ver tabla',
  'selection.emptyHint': 'Todavia no hay elementos seleccionados. Use la herramienta de seleccion sobre el mapa.',
  'table.resize': 'Arrastre para cambiar la altura',
  'selection.collapse': 'Contraer',
  'selection.expand': 'Expandir',

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
  'selection.querying': 'Consultando capas...',
  'selection.noResults':
    'No se encontraron elementos. Verifique que la capa este encendida y acerque el mapa (algunas capas solo se consultan a cierta escala).',

  'tool.table': 'Tabla de atributos',
  'panel.table': 'Tabla de atributos',
  'table.layer': 'Capa',
  'table.scopeVisible': 'Solo lo visible',
  'table.scopeAll': 'Ver todo',
  'table.noLayers': 'No hay capas consultables en el mapa.',
  'table.loading': 'Cargando capas...',
  'table.hintVisible': 'Muestra unicamente los elementos dentro del area visible del mapa.',
  'table.hintAll': 'Muestra todos los elementos de la capa (limitado por el servicio).',

  'layers.zoomTo': 'Zoom a la capa',
  'layers.zoomToTitle': 'Acercar el mapa a la extension completa de la capa',
  'layers.noExtent': 'La capa no informa una extension valida.',

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
  'sv.popupBlocked':
    'El navegador bloqueo la ventana emergente de Street View. Permita las ventanas emergentes para este sitio o use el enlace:',
  'sv.openInGoogle': 'Abrir en Google Street View',
  'sv.pickOnMap': 'Elegir punto en el mapa',
  'sv.pickOnMapActive': 'Cancelar seleccion',
  'sv.pickHint': 'Haga clic en cualquier lugar del mapa para abrir Street View en ese punto.',
  'sv.noKeyHint':
    'Sin clave de Google configurada: Street View se abre en una ventana emergente independiente del navegador (no requiere clave).',
  'tool.streetView': 'Street View',
  'panel.streetView': 'Google Street View',
};

const enUS: Dictionary = {
  'app.exit': 'Sign out',
  'app.themeLight': 'Light',
  'app.themeDark': 'Dark',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',

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
  'filter.values': 'Values',
  'filter.searchValues': 'Search value',
  'filter.searchPlaceholder': 'Type to filter the list...',
  'filter.noMatches': 'No value matches the search.',
  'filter.tooMany': 'Showing the first 300 of {n}. Refine the search.',

  'selection.layer': 'Layer',
  'selection.dock': 'Table',
  'selection.hintClick': 'Click a feature on the map to select it.',
  'selection.hintDraw': 'Draw an area on the map to select the features inside.',
  'selection.viewTable': 'View table',
  'selection.emptyHint': 'No features selected yet. Use the selection tool on the map.',
  'table.resize': 'Drag to resize',
  'selection.collapse': 'Collapse',
  'selection.expand': 'Expand',

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
  'selection.querying': 'Querying layers...',
  'selection.noResults':
    'No features found. Check that the layer is turned on and zoom in (some layers are only queryable at certain scales).',

  'tool.table': 'Attribute table',
  'panel.table': 'Attribute table',
  'table.layer': 'Layer',
  'table.scopeVisible': 'Visible only',
  'table.scopeAll': 'Show all',
  'table.noLayers': 'No queryable layers in the map.',
  'table.loading': 'Loading layers...',
  'table.hintVisible': 'Shows only features within the current map extent.',
  'table.hintAll': 'Shows all features of the layer (limited by the service).',

  'layers.zoomTo': 'Zoom to layer',
  'layers.zoomToTitle': 'Zoom the map to the full extent of the layer',
  'layers.noExtent': 'The layer does not report a valid extent.',

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
  'sv.popupBlocked':
    'The browser blocked the Street View popup window. Allow popups for this site or use the link:',
  'sv.openInGoogle': 'Open in Google Street View',
  'sv.pickOnMap': 'Pick a point on the map',
  'sv.pickOnMapActive': 'Cancel picking',
  'sv.pickHint': 'Click anywhere on the map to open Street View at that point.',
  'sv.noKeyHint':
    'No Google key configured: Street View opens in a separate browser popup window (no key required).',
  'tool.streetView': 'Street View',
  'panel.streetView': 'Google Street View',
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
