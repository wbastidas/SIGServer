/**
 * Hook de internacionalizacion (RNF-UX-04). Toma el locale de la configuracion
 * (`app.defaultLocale`) y expone `t(key)`. Preparado para conmutar idioma sin
 * reescribir componentes.
 */
import { useCallback } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { DEFAULT_LOCALE, LocaleKey, translate } from './strings';

export function useI18n() {
  const locale = useConfigStore((s) => s.config?.app.app.defaultLocale ?? DEFAULT_LOCALE);
  const t = useCallback((key: LocaleKey) => translate(locale, key), [locale]);
  return { locale, t };
}
