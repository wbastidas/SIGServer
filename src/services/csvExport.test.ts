import { describe, it, expect } from 'vitest';
import { buildCsv, exportFieldsForLayer, geometryColumns, geometryHeaders } from './csvExport';

describe('geometryColumns', () => {
  it('devuelve X e Y para un punto', () => {
    expect(geometryColumns({ type: 'point', x: 620450.1234, y: 9758300.5678 })).toEqual({
      X: 620450.123,
      Y: 9758300.568,
    });
  });

  it('devuelve X/Y inicial y final para una linea', () => {
    expect(
      geometryColumns({
        type: 'polyline',
        paths: [
          [
            [100, 200],
            [150, 250],
            [300, 400],
          ],
        ],
      }),
    ).toEqual({ X_INICIAL: 100, Y_INICIAL: 200, X_FINAL: 300, Y_FINAL: 400 });
  });

  it('toma el primer y el ultimo vertice cuando la linea tiene varios tramos', () => {
    expect(
      geometryColumns({
        type: 'polyline',
        paths: [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ],
      }),
    ).toEqual({ X_INICIAL: 1, Y_INICIAL: 2, X_FINAL: 7, Y_FINAL: 8 });
  });

  it('usa el centro para poligonos', () => {
    expect(
      geometryColumns({ type: 'polygon', rings: [], extent: { center: { x: 10, y: 20 } } }),
    ).toEqual({ X: 10, Y: 20 });
  });

  it('devuelve vacio sin geometria', () => {
    expect(geometryColumns(null)).toEqual({});
    expect(geometryColumns(undefined)).toEqual({});
  });
});

describe('geometryHeaders', () => {
  it('ordena las columnas de forma estable', () => {
    const headers = geometryHeaders([
      { geometry: { type: 'polyline', paths: [[[1, 2], [3, 4]]] } },
      { geometry: { type: 'point', x: 5, y: 6 } },
    ]);
    expect(headers).toEqual(['X', 'Y', 'X_INICIAL', 'Y_INICIAL', 'X_FINAL', 'Y_FINAL']);
  });
});

describe('exportFieldsForLayer', () => {
  it('exporta todos los atributos si no hay configuracion', () => {
    expect(exportFieldsForLayer(undefined, 'Postes', ['A', 'B'])).toEqual(['A', 'B']);
  });

  it('usa los campos configurados respetando el case del servicio', () => {
    expect(
      exportFieldsForLayer({ fields: [{ name: 'objectid' }] }, 'Postes', ['OBJECTID', 'TIPO']),
    ).toEqual(['OBJECTID']);
  });

  it('prioriza los campos especificos de la capa', () => {
    const cfg = {
      fields: [{ name: 'OBJECTID' }],
      fieldsByLayer: { Transformadores: [{ name: 'TRAFO' }] },
    };
    expect(exportFieldsForLayer(cfg, 'Transformadores', ['OBJECTID', 'TRAFO'])).toEqual([
      'TRAFO',
    ]);
  });
});

describe('buildCsv', () => {
  it('exporta el valor almacenado, no la descripcion del dominio', () => {
    // TIPO=3 debe salir como 3 aunque en pantalla se lea "Poste de hormigon".
    const csv = buildCsv([{ attributes: { OBJECTID: 1, TIPO: 3 }, geometry: null }], {
      includeGeometry: false,
    });
    expect(csv).toBe('"OBJECTID","TIPO"\r\n"1","3"');
  });

  it('anade X e Y en puntos', () => {
    const csv = buildCsv(
      [{ attributes: { OBJECTID: 1 }, geometry: { type: 'point', x: 10, y: 20 } }],
      { includeGeometry: true },
    );
    expect(csv).toBe('"OBJECTID","X","Y"\r\n"1","10","20"');
  });

  it('anade XY inicial y final en lineas', () => {
    const csv = buildCsv(
      [
        {
          attributes: { OBJECTID: 7 },
          geometry: { type: 'polyline', paths: [[[1, 2], [3, 4]]] },
        },
      ],
      { includeGeometry: true },
    );
    expect(csv).toBe(
      '"OBJECTID","X_INICIAL","Y_INICIAL","X_FINAL","Y_FINAL"\r\n"7","1","2","3","4"',
    );
  });

  it('puede incluir la columna de capa', () => {
    const csv = buildCsv([{ attributes: { OBJECTID: 1 } }], {
      includeGeometry: false,
      includeLayerColumn: true,
      layerTitle: 'Postes',
    });
    expect(csv).toBe('"CAPA","OBJECTID"\r\n"Postes","1"');
  });

  it('escapa comillas dobles', () => {
    const csv = buildCsv([{ attributes: { N: 'a"b' } }], { includeGeometry: false });
    expect(csv).toBe('"N"\r\n"a""b"');
  });

  it('devuelve vacio sin registros', () => {
    expect(buildCsv([])).toBe('');
  });
});
