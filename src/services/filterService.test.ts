import { describe, it, expect } from 'vitest';
import { filterFields, filterLabel } from './filterService';
import type { FilterConfig } from '@/types/config';

describe('filterFields', () => {
  it('devuelve los campos configurados', () => {
    const cfg: FilterConfig = {
      fields: ['ALIMENTADORID', 'ALIMENTADOR'],
      allowMultiple: true,
    };
    expect(filterFields(cfg)).toEqual(['ALIMENTADORID', 'ALIMENTADOR']);
  });

  it('acepta la forma antigua de un solo campo', () => {
    // Configuraciones ya desplegadas siguen funcionando sin tocarlas.
    const cfg: FilterConfig = { layerId: 9, field: 'ALIMENTADORID', allowMultiple: true };
    expect(filterFields(cfg)).toEqual(['ALIMENTADORID']);
  });

  it('prioriza `fields` sobre `field`', () => {
    const cfg: FilterConfig = {
      fields: ['NUEVO'],
      field: 'VIEJO',
      allowMultiple: false,
    };
    expect(filterFields(cfg)).toEqual(['NUEVO']);
  });

  it('devuelve vacio si no hay campos', () => {
    expect(filterFields({ allowMultiple: false })).toEqual([]);
  });
});

describe('filterLabel', () => {
  it('usa la etiqueta configurada', () => {
    expect(
      filterLabel({ label: 'Alimentador', fields: ['ALIMENTADORID'], allowMultiple: true }),
    ).toBe('Alimentador');
  });

  it('sin etiqueta, compone los campos', () => {
    expect(
      filterLabel({ fields: ['ALIMENTADORID', 'ALIMENTADOR'], allowMultiple: true }),
    ).toBe('ALIMENTADORID / ALIMENTADOR');
  });

  it('sin etiqueta ni campos, usa un texto por defecto', () => {
    expect(filterLabel({ allowMultiple: false })).toBe('Filtro');
  });
});
