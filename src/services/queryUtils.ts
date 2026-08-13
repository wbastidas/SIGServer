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

/**
 * Escapa texto para interpolarlo en HTML (previene inyeccion via valores de
 * atributos que vienen del servicio). Usado al construir contenido de popups.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Nota: la exportacion a CSV vive en `csvExport.ts`, que ademas resuelve los
 * campos configurados y anade las columnas de geometria (X/Y en puntos, X/Y
 * inicial y final en lineas).
 */
