/**
 * Resolucion de las columnas mostradas en la tabla de seleccion (RF-SEL-02).
 *
 * Logica pura (sin SDK ni DOM) para poder probarla:
 *  - Columnas generales desde `selection.fields`.
 *  - Columnas especificas por capa desde `selection.fieldsByLayer`, que permite
 *    mostrar mas campos en ciertos elementos sin cambiar el resto.
 *  - Los nombres se comparan sin distinguir mayusculas, porque cada servicio
 *    publica los campos con un case distinto (OBJECTID / ObjectId / objectid).
 */
import type { SelectionConfig, SelectionFieldConfig } from '@/types/config';

export interface ResolvedColumn {
  /** Nombre real del campo tal y como lo publica el servicio. */
  name: string;
  label: string;
}

/** Campos por defecto si la configuracion no define ninguno. */
export const DEFAULT_FIELDS: SelectionFieldConfig[] = [
  { name: 'OBJECTID' },
  { name: 'GLOBALID' },
];

/** Numero de columnas usadas como respaldo cuando ninguna configurada existe. */
const FALLBACK_COLUMNS = 4;

/** Devuelve la lista de campos configurada para una capa concreta. */
export function fieldsForLayer(
  cfg: SelectionConfig | undefined,
  layerTitle: string,
): SelectionFieldConfig[] {
  const byLayer = cfg?.fieldsByLayer ?? {};
  const direct = byLayer[layerTitle];
  if (direct?.length) return direct;

  const insensitive = Object.entries(byLayer).find(
    ([key]) => key.toLowerCase() === layerTitle.toLowerCase(),
  )?.[1];
  if (insensitive?.length) return insensitive;

  return cfg?.fields?.length ? cfg.fields : DEFAULT_FIELDS;
}

/**
 * Cruza los campos configurados con los realmente disponibles en los elementos.
 * Si ninguno coincide, devuelve las primeras columnas disponibles para que la
 * tabla nunca quede vacia.
 */
export function resolveColumns(
  configured: SelectionFieldConfig[],
  availableFields: string[],
): ResolvedColumn[] {
  const resolved: ResolvedColumn[] = [];
  for (const col of configured) {
    const real = availableFields.find((a) => a.toLowerCase() === col.name.toLowerCase());
    if (real) resolved.push({ name: real, label: col.label ?? col.name });
  }
  if (resolved.length > 0) return resolved;
  return availableFields
    .slice(0, FALLBACK_COLUMNS)
    .map((name) => ({ name, label: name }));
}

/** Une los nombres de campo presentes en un conjunto de registros. */
export function collectFieldNames(
  records: { attributes?: Record<string, unknown> | null }[],
): string[] {
  const set = new Set<string>();
  for (const r of records) {
    Object.keys(r.attributes ?? {}).forEach((k) => set.add(k));
  }
  return Array.from(set);
}
