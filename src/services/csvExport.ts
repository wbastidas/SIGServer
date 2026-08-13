/**
 * Exportacion a CSV de los elementos seleccionados (RF-SEL-05).
 *
 * Decisiones importantes:
 *  - Se exporta el VALOR ALMACENADO, no la descripcion del dominio. En pantalla
 *    interesa leer "Poste de hormigon", pero en el archivo interesa el codigo
 *    original para poder cruzarlo con la base de datos.
 *  - Se anaden columnas de geometria: X/Y para puntos y X/Y inicial y final
 *    para lineas, que es lo que se necesita para ubicar el elemento fuera del
 *    visor.
 *  - Que columnas salen se define en `export` dentro de app-config.json, con
 *    posibilidad de afinar por capa.
 *
 * Logica pura: sin SDK ni DOM, para poder probarla.
 */
import type { ExportConfig, SelectionFieldConfig } from '@/types/config';

/** Geometria minima necesaria, compatible con la del SDK sin acoplarse a el. */
export interface GeometryLike {
  type?: string;
  x?: number;
  y?: number;
  paths?: number[][][];
  rings?: number[][][];
  extent?: { center?: { x: number; y: number } } | null;
}

export interface ExportRecord {
  attributes?: Record<string, unknown> | null;
  geometry?: GeometryLike | null;
}

export interface GeometryColumns {
  X?: number;
  Y?: number;
  X_INICIAL?: number;
  Y_INICIAL?: number;
  X_FINAL?: number;
  Y_FINAL?: number;
}

const DEFAULT_GEOMETRY_LABELS = {
  x: 'X',
  y: 'Y',
  xStart: 'X_INICIAL',
  yStart: 'Y_INICIAL',
  xEnd: 'X_FINAL',
  yEnd: 'Y_FINAL',
} as const;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Extrae las columnas de geometria de un elemento.
 *  - Punto: X, Y.
 *  - Linea: X/Y del primer vertice y del ultimo.
 *  - Poligono: X/Y del centro (referencia aproximada).
 */
export function geometryColumns(
  geometry: GeometryLike | null | undefined,
  decimals = 3,
): GeometryColumns {
  if (!geometry) return {};

  if (geometry.type === 'point' || (geometry.x != null && geometry.y != null && !geometry.paths)) {
    if (geometry.x == null || geometry.y == null) return {};
    return { X: round(geometry.x, decimals), Y: round(geometry.y, decimals) };
  }

  if (geometry.paths?.length) {
    // Primer vertice del primer tramo y ultimo vertice del ultimo tramo.
    const firstPath = geometry.paths[0];
    const lastPath = geometry.paths[geometry.paths.length - 1];
    const start = firstPath?.[0];
    const end = lastPath?.[lastPath.length - 1];
    if (!start || !end) return {};
    return {
      X_INICIAL: round(start[0], decimals),
      Y_INICIAL: round(start[1], decimals),
      X_FINAL: round(end[0], decimals),
      Y_FINAL: round(end[1], decimals),
    };
  }

  const center = geometry.extent?.center;
  if (center) {
    return { X: round(center.x, decimals), Y: round(center.y, decimals) };
  }
  return {};
}

/** Cabeceras de geometria que corresponden a un conjunto de elementos. */
export function geometryHeaders(records: ExportRecord[]): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    for (const key of Object.keys(geometryColumns(r.geometry))) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }
  // Orden estable y previsible.
  const order = [
    DEFAULT_GEOMETRY_LABELS.x,
    DEFAULT_GEOMETRY_LABELS.y,
    DEFAULT_GEOMETRY_LABELS.xStart,
    DEFAULT_GEOMETRY_LABELS.yStart,
    DEFAULT_GEOMETRY_LABELS.xEnd,
    DEFAULT_GEOMETRY_LABELS.yEnd,
  ];
  return order.filter((h) => headers.includes(h));
}

/** Campos de atributos a exportar para una capa. */
export function exportFieldsForLayer(
  cfg: ExportConfig | undefined,
  layerTitle: string,
  availableFields: string[],
): string[] {
  const byLayer = cfg?.fieldsByLayer ?? {};
  const specific =
    byLayer[layerTitle] ??
    Object.entries(byLayer).find(([k]) => k.toLowerCase() === layerTitle.toLowerCase())?.[1];

  const configured: SelectionFieldConfig[] | undefined = specific ?? cfg?.fields;

  // Sin configuracion: se exportan todos los atributos disponibles.
  if (!configured?.length) return availableFields;

  const resolved: string[] = [];
  for (const field of configured) {
    const real = availableFields.find((a) => a.toLowerCase() === field.name.toLowerCase());
    if (real) resolved.push(real);
  }
  return resolved.length > 0 ? resolved : availableFields;
}

function escapeCsv(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export interface BuildCsvOptions {
  cfg?: ExportConfig;
  layerTitle?: string;
  /** Incluir columnas de geometria (X/Y, X/Y inicial y final). */
  includeGeometry?: boolean;
  /** Anadir una columna con el nombre de la capa. */
  includeLayerColumn?: boolean;
}

/**
 * Construye el CSV. Los valores salen tal cual estan almacenados (sin traducir
 * dominios), que es lo que se necesita para tratar el archivo despues.
 */
export function buildCsv(records: ExportRecord[], options: BuildCsvOptions = {}): string {
  if (records.length === 0) return '';

  const available: string[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r.attributes ?? {})) {
      if (!seen.has(k)) {
        seen.add(k);
        available.push(k);
      }
    }
  }

  const attrFields = exportFieldsForLayer(options.cfg, options.layerTitle ?? '', available);
  const includeGeometry = options.includeGeometry ?? options.cfg?.includeGeometry ?? true;
  const geoFields = includeGeometry ? geometryHeaders(records) : [];

  const header = [
    ...(options.includeLayerColumn ? ['CAPA'] : []),
    ...attrFields,
    ...geoFields,
  ]
    .map(escapeCsv)
    .join(',');

  const rows = records.map((r) => {
    const geo = includeGeometry ? geometryColumns(r.geometry) : {};
    const cells = [
      ...(options.includeLayerColumn ? [options.layerTitle ?? ''] : []),
      ...attrFields.map((f) => (r.attributes ?? {})[f]),
      ...geoFields.map((f) => (geo as Record<string, number | undefined>)[f]),
    ];
    return cells.map(escapeCsv).join(',');
  });

  return [header, ...rows].join('\r\n');
}
