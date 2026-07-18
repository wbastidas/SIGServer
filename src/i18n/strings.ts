/**
 * Internacionalizacion preparada (RNF-UX-04). Diccionario por locale con es-EC
 * por defecto. Para agregar un idioma, añada una entrada al objeto `dictionaries`.
 * Los componentes consumen las cadenas con el hook `useI18n().t(key)`.
 */
export type LocaleKey =
  | 'app.exit'
  | 'app.themeLight'
  | 'app.themeDark'
  | 'tool.search'
  | 'tool.layers'
  | 'tool.filter'
  | 'tool.selection'
  | 'tool.draw'
  | 'tool.measure'
  | 'tool.goto'
  | 'tool.print'
  | 'panel.search'
  | 'panel.layers'
  | 'panel.filter'
  | 'panel.selection'
  | 'panel.draw'
  | 'panel.measure'
  | 'panel.goto'
  | 'panel.print';

type Dictionary = Record<LocaleKey, string>;

const esEC: Dictionary = {
  'app.exit': 'Salir',
  'app.themeLight': 'Claro',
  'app.themeDark': 'Oscuro',
  'tool.search': 'Buscar',
  'tool.layers': 'Capas y leyenda',
  'tool.filter': 'Filtros',
  'tool.selection': 'Seleccion / Tabla',
  'tool.draw': 'Dibujo',
  'tool.measure': 'Medicion',
  'tool.goto': 'Ir a XY / LatLong',
  'tool.print': 'Imprimir',
  'panel.search': 'Busqueda',
  'panel.layers': 'Capas y leyenda',
  'panel.filter': 'Filtros',
  'panel.selection': 'Seleccion y tabla',
  'panel.draw': 'Dibujo',
  'panel.measure': 'Medicion',
  'panel.goto': 'Ir a una ubicacion',
  'panel.print': 'Impresion',
};

// Plantilla para futuros idiomas (en-US), de momento cae a es-EC.
const enUS: Partial<Dictionary> = {
  'app.exit': 'Sign out',
  'app.themeLight': 'Light',
  'app.themeDark': 'Dark',
};

export const dictionaries: Record<string, Partial<Dictionary>> = {
  'es-EC': esEC,
  'es': esEC,
  'en-US': enUS,
  'en': enUS,
};

export const DEFAULT_LOCALE = 'es-EC';

export function translate(locale: string, key: LocaleKey): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  return dict[key] ?? esEC[key] ?? key;
}
