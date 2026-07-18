import { describe, it, expect } from 'vitest';
import { translate } from './strings';

describe('translate', () => {
  it('devuelve la cadena en es-EC por defecto', () => {
    expect(translate('es-EC', 'common.clear')).toBe('Limpiar');
  });

  it('devuelve la cadena en en-US', () => {
    expect(translate('en-US', 'common.clear')).toBe('Clear');
  });

  it('interpola parametros con {marcador}', () => {
    expect(translate('es-EC', 'search.results', { n: 3 })).toBe(
      '3 resultado(s). Haga clic para ubicar en el mapa.',
    );
    expect(translate('en-US', 'goto.projected', { wkid: 32717 })).toBe(
      'Projected (WKID 32717)',
    );
  });

  it('cae al locale por defecto si el idioma no existe', () => {
    expect(translate('fr-FR', 'common.apply')).toBe('Aplicar');
  });

  it('deja el marcador si falta el parametro', () => {
    expect(translate('es-EC', 'goto.errNav')).toBe('No se pudo navegar: {msg}');
  });
});
