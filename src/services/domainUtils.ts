/**
 * Resolucion de dominios de ArcGIS: convierte los codigos almacenados en la
 * base de datos a su descripcion legible (codedValue domains).
 *
 * Sin esto, los filtros y las tablas muestran el codigo interno (p. ej. "3")
 * en lugar del valor entendible por el usuario (p. ej. "Poste de hormigon").
 */
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';

export interface DomainMap {
  /** codigo -> descripcion. */
  codeToName: Map<string, string>;
  /** true si el campo tiene un dominio de valores codificados. */
  hasDomain: boolean;
}

const EMPTY: DomainMap = { codeToName: new Map(), hasDomain: false };

/**
 * Obtiene el mapa codigo->descripcion de un campo. Considera tanto el dominio
 * del propio campo como los dominios por subtipo, que son frecuentes en redes
 * electricas (cada subtipo puede redefinir el dominio de un campo).
 */
export async function getDomainMap(
  layer: FeatureLayer,
  fieldName: string,
): Promise<DomainMap> {
  try {
    await layer.load();
  } catch {
    return EMPTY;
  }

  const codeToName = new Map<string, string>();
  let hasDomain = false;

  const collect = (domain: any) => {
    if (!domain || domain.type !== 'coded-value' || !Array.isArray(domain.codedValues)) return;
    hasDomain = true;
    for (const cv of domain.codedValues) {
      if (cv?.code != null) codeToName.set(String(cv.code), String(cv.name ?? cv.code));
    }
  };

  const field = layer.fields?.find(
    (f) => f.name?.toLowerCase() === fieldName.toLowerCase(),
  );
  collect(field?.domain);

  // Dominios definidos a nivel de subtipo.
  const subtypes = (layer as any).subtypes as any[] | undefined;
  if (Array.isArray(subtypes)) {
    for (const st of subtypes) {
      const dom = st?.domains?.[fieldName] ?? st?.domains?.[fieldName?.toUpperCase()];
      collect(dom);
    }
  }

  return { codeToName, hasDomain };
}

/** Devuelve la descripcion del codigo, o el propio valor si no hay dominio. */
export function describeValue(domain: DomainMap, value: unknown): string {
  const raw = String(value ?? '');
  return domain.codeToName.get(raw) ?? raw;
}

/** Etiqueta para mostrar: "Descripcion (codigo)" cuando ambos difieren. */
export function labelWithCode(domain: DomainMap, value: unknown): string {
  const raw = String(value ?? '');
  const name = domain.codeToName.get(raw);
  return name && name !== raw ? `${name} (${raw})` : raw;
}
