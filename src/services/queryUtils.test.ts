import { describe, it, expect } from 'vitest';
import { escapeLike, escapeHtml, buildWhere, buildValueWhere } from './queryUtils';

describe('escapeLike', () => {
  it('duplica comillas simples para evitar inyeccion', () => {
    expect(escapeLike("O'Brien")).toBe("O''Brien");
    expect(escapeLike('sin comillas')).toBe('sin comillas');
  });
});

describe('escapeHtml', () => {
  it('escapa los caracteres especiales de HTML', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
    expect(escapeHtml(`a & b "c" 'd'`)).toBe('a &amp; b &quot;c&quot; &#39;d&#39;');
  });

  it('tolera null/undefined y numeros', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
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
