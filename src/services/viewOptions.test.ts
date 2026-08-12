import { describe, it, expect } from 'vitest';
import { buildViewOptions, hasUsableExtent, zoomToScale } from './viewOptions';
import type { MapConfig } from '@/types/config';

const base: MapConfig = {
  basemapUrl: 'https://servidor/arcgis/rest/services/Base/MapServer',
  basemapType: 'tiled',
  operationalServiceUrl: 'https://servidor/arcgis/rest/services/Red/MapServer',
  operationalMode: 'mapimage',
  spatialReferenceWkid: 32717,
  initialZoom: 12,
};

describe('zoomToScale', () => {
  it('convierte niveles de zoom a escala decreciente', () => {
    expect(zoomToScale(0)).toBeCloseTo(591657527.591555, 3);
    expect(zoomToScale(12)).toBeCloseTo(591657527.591555 / 4096, 3);
    expect(zoomToScale(15)).toBeLessThan(zoomToScale(12));
  });

  it('usa un nivel por defecto si no se indica', () => {
    expect(zoomToScale(undefined)).toBe(zoomToScale(12));
  });
});

describe('hasUsableExtent', () => {
  it('descarta la extension en ceros del ejemplo de configuracion', () => {
    expect(
      hasUsableExtent({ ...base, initialExtent: { xmin: 0, ymin: 0, xmax: 0, ymax: 0 } }),
    ).toBe(false);
  });

  it('acepta una extension real', () => {
    expect(
      hasUsableExtent({
        ...base,
        initialExtent: { xmin: 600000, ymin: 9750000, xmax: 640000, ymax: 9790000 },
      }),
    ).toBe(true);
  });
});

describe('buildViewOptions', () => {
  it('habilita zoom continuo (snapToZoom desactivado)', () => {
    // Es la clave para que la rueda y los botones +/- respondan cuando la vista
    // no tiene niveles LOD del basemap.
    expect(buildViewOptions(base).constraints.snapToZoom).toBe(false);
  });

  it('usa escala y no nivel de zoom cuando no hay extension', () => {
    const opts = buildViewOptions(base);
    expect(opts.useExtent).toBe(false);
    expect(opts.scale).toBe(zoomToScale(12));
  });

  it('usa la extension cuando esta definida y omite la escala', () => {
    const opts = buildViewOptions({
      ...base,
      initialExtent: { xmin: 600000, ymin: 9750000, xmax: 640000, ymax: 9790000 },
    });
    expect(opts.useExtent).toBe(true);
    expect(opts.scale).toBeUndefined();
  });

  it('trata 0 como "sin limite" de escala', () => {
    const opts = buildViewOptions({ ...base, minScale: 0, maxScale: 0 });
    expect(opts.constraints.minScale).toBe(0);
    expect(opts.constraints.maxScale).toBe(0);
  });

  it('respeta los limites de escala configurados', () => {
    const opts = buildViewOptions({ ...base, minScale: 50000, maxScale: 500 });
    expect(opts.constraints.minScale).toBe(50000);
    expect(opts.constraints.maxScale).toBe(500);
  });
});
