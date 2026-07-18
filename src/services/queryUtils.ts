/**
 * Utilidades puras de construccion de consultas y exportacion. Sin dependencias
 * del SDK de ArcGIS ni del DOM, para poder probarse de forma unitaria y reutilizarse
 * en busqueda, filtros y seleccion (RF-SRC/FIL/SEL).
 */
import type { SearchOperator } from '@/types/config';

/** Escapa comillas simples para evitar inyeccion en clausulas WHERE de ArcGIS. */
export function escapeLike(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Construye una clausula WHERE para un unico valor.
 *  - LIKE con coincidencia parcial e insensible a mayusculas via UPPER() (RF-SRC-02).
 *  - Igualdad exacta para operador '='.
 */
export function buildWhere(
  field: string,
  operator: SearchOperator,
  value: string,
  caseInsensitive?: boolean,
): string {
  const safe = escapeLike(value);
  if (operator === 'LIKE') {
    return caseInsensitive
      ? `UPPER(${field}) LIKE UPPER('%${safe}%')`
      : `${field} LIKE '%${safe}%'`;
  }
  return `${field} = '${safe}'`;
}

/**
 * Construye una clausula WHERE para uno o varios valores (RF-FIL-02).
 * Un valor -> igualdad; varios -> IN (...). Cadena vacia si no hay valores.
 */
export function buildValueWhere(field: string, values: string[]): string {
  if (values.length === 0) return '';
  if (values.length === 1) return `${field} = '${escapeLike(values[0])}'`;
  const list = values.map((v) => `'${escapeLike(v)}'`).join(',');
  return `${field} IN (${list})`;
}

/** Registro minimo con atributos, compatible con Graphic sin acoplar al SDK. */
export interface AttributeBag {
  attributes?: Record<string, unknown> | null;
}

/**
 * Serializa una lista de elementos a CSV (RF-SEL-05). Une el conjunto de campos
 * de todos los elementos, escapa comillas y separa filas con CRLF.
 */
export function featuresToCsv(features: AttributeBag[]): string {
  if (features.length === 0) return '';
  const fields = Array.from(
    features.reduce((set, f) => {
      Object.keys(f.attributes ?? {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = fields.map(escape).join(',');
  const rows = features.map((f) =>
    fields.map((k) => escape((f.attributes ?? {})[k])).join(','),
  );
  return [header, ...rows].join('\r\n');
}
