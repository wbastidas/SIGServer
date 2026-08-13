import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FIELDS,
  collectFieldNames,
  fieldsForLayer,
  resolveColumns,
} from './selectionColumns';
import type { SelectionConfig } from '@/types/config';

const cfg: SelectionConfig = {
  fields: [{ name: 'OBJECTID' }, { name: 'GLOBALID' }],
  showLayerName: true,
  fieldsByLayer: {
    Transformadores: [{ name: 'OBJECTID' }, { name: 'TRAFO', label: 'Codigo TRAFO' }],
  },
};

describe('fieldsForLayer', () => {
  it('usa los campos generales cuando la capa no tiene configuracion propia', () => {
    expect(fieldsForLayer(cfg, 'Postes').map((f) => f.name)).toEqual([
      'OBJECTID',
      'GLOBALID',
    ]);
  });

  it('usa los campos especificos de la capa cuando existen', () => {
    expect(fieldsForLayer(cfg, 'Transformadores').map((f) => f.name)).toEqual([
      'OBJECTID',
      'TRAFO',
    ]);
  });

  it('encuentra la capa aunque cambie el uso de mayusculas', () => {
    expect(fieldsForLayer(cfg, 'TRANSFORMADORES').map((f) => f.name)).toEqual([
      'OBJECTID',
      'TRAFO',
    ]);
  });

  it('cae a OBJECTID/GLOBALID si no hay configuracion', () => {
    expect(fieldsForLayer(undefined, 'Postes')).toEqual(DEFAULT_FIELDS);
  });
});

describe('resolveColumns', () => {
  it('respeta el nombre real del servicio aunque cambie el case', () => {
    const cols = resolveColumns(
      [{ name: 'OBJECTID' }, { name: 'GLOBALID' }],
      ['ObjectId', 'GlobalID', 'TIPO'],
    );
    expect(cols).toEqual([
      { name: 'ObjectId', label: 'OBJECTID' },
      { name: 'GlobalID', label: 'GLOBALID' },
    ]);
  });

  it('omite los campos que la capa no publica', () => {
    const cols = resolveColumns([{ name: 'OBJECTID' }, { name: 'NO_EXISTE' }], [
      'OBJECTID',
      'TIPO',
    ]);
    expect(cols.map((c) => c.name)).toEqual(['OBJECTID']);
  });

  it('usa las primeras columnas si ninguna configurada existe', () => {
    const cols = resolveColumns([{ name: 'NO_EXISTE' }], ['A', 'B', 'C', 'D', 'E']);
    expect(cols.map((c) => c.name)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('aplica la etiqueta configurada', () => {
    const cols = resolveColumns([{ name: 'TRAFO', label: 'Codigo TRAFO' }], ['TRAFO']);
    expect(cols[0].label).toBe('Codigo TRAFO');
  });
});

describe('collectFieldNames', () => {
  it('une los campos de todos los registros', () => {
    expect(
      collectFieldNames([{ attributes: { A: 1 } }, { attributes: { B: 2 } }]),
    ).toEqual(['A', 'B']);
  });

  it('tolera atributos nulos', () => {
    expect(collectFieldNames([{ attributes: null }, {}])).toEqual([]);
  });
});
