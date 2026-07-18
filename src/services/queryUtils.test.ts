import { describe, it, expect } from 'vitest';
import { escapeLike, buildWhere, buildValueWhere, featuresToCsv } from './queryUtils';

describe('escapeLike', () => {
  it('duplica comillas simples para evitar inyeccion', () => {
    expect(escapeLike("O'Brien")).toBe("O''Brien");
    expect(escapeLike('sin comillas')).toBe('sin comillas');
  });
});

describe('buildWhere', () => {
  it('LIKE insensible a mayusculas usa UPPER en ambos lados (RF-SRC-02)', () => {
    expect(buildWhere('TRAFO', 'LIKE', 'ab', true)).toBe(
      "UPPER(TRAFO) LIKE UPPER('%ab%')",
    );
  });

  it('LIKE sensible a mayusculas', () => {
    expect(buildWhere('TRAFO', 'LIKE', 'ab', false)).toBe("TRAFO LIKE '%ab%'");
  });

  it('operador de igualdad', () => {
    expect(buildWhere('CODIGOUNICO', '=', '123', false)).toBe("CODIGOUNICO = '123'");
  });

  it('escapa el valor de busqueda', () => {
    expect(buildWhere('N', 'LIKE', "x'y", false)).toBe("N LIKE '%x''y%'");
  });
});

describe('buildValueWhere', () => {
  it('sin valores devuelve cadena vacia', () => {
    expect(buildValueWhere('ALIMENTADORID', [])).toBe('');
  });

  it('un valor genera igualdad (RF-FIL-02 individual)', () => {
    expect(buildValueWhere('ALIMENTADORID', ['A1'])).toBe("ALIMENTADORID = 'A1'");
  });

  it('varios valores generan IN (RF-FIL-02 multiple)', () => {
    expect(buildValueWhere('ALIMENTADORID', ['A1', 'A2', 'A3'])).toBe(
      "ALIMENTADORID IN ('A1','A2','A3')",
    );
  });

  it('escapa comillas dentro de IN', () => {
    expect(buildValueWhere('N', ["a'b", 'c'])).toBe("N IN ('a''b','c')");
  });
});

describe('featuresToCsv', () => {
  it('lista vacia devuelve cadena vacia', () => {
    expect(featuresToCsv([])).toBe('');
  });

  it('serializa encabezado y filas con CRLF', () => {
    const csv = featuresToCsv([
      { attributes: { TRAFO: 'T1', ALIMENTADORID: 'A1' } },
      { attributes: { TRAFO: 'T2', ALIMENTADORID: 'A2' } },
    ]);
    expect(csv).toBe(
      '"TRAFO","ALIMENTADORID"\r\n"T1","A1"\r\n"T2","A2"',
    );
  });

  it('une campos de todos los elementos y escapa comillas dobles', () => {
    const csv = featuresToCsv([
      { attributes: { A: 'x"y' } },
      { attributes: { B: 1 } },
    ]);
    const [header, row1, row2] = csv.split('\r\n');
    expect(header).toBe('"A","B"');
    expect(row1).toBe('"x""y",""');
    expect(row2).toBe('"","1"');
  });

  it('maneja atributos nulos sin lanzar (encabezado y fila vacios)', () => {
    expect(featuresToCsv([{ attributes: null }])).toBe('\r\n');
  });
});
