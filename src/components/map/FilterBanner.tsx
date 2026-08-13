/**
 * Aviso del filtro activo sobre el mapa.
 *
 * Sin esto el filtro es invisible: el mapa muestra menos elementos y no queda
 * claro por que. El aviso indica que se esta filtrando, a cuantas capas afecta
 * y permite APAGARLO sin abrir el panel.
 */
import { CalciteAction, CalciteChip } from '@esri/calcite-components-react';
import { useFilterStore } from '@/store/useFilterStore';
import { useMapStore } from '@/store/useMapStore';
import { useConfigStore } from '@/store/useConfigStore';
import { resolveFilterTargets, clearFilter } from '@/services/filterService';
import { useI18n } from '@/i18n/useI18n';
import './filter-banner.css';

const MAX_SHOWN = 4;

export function FilterBanner() {
  const active = useFilterStore((s) => s.active);
  const clearActive = useFilterStore((s) => s.clear);
  const map = useMapStore((s) => s.map);
  const filters = useConfigStore((s) => s.config?.app.filters ?? []);
  const { t } = useI18n();

  if (!active) return null;

  async function turnOff() {
    // Se recalculan las capas afectadas por si cambio la visibilidad, para no
    // dejar ninguna con el filtro puesto.
    const cfg = filters.find((f, i) => (f.id ?? String(i)) === active!.id);
    if (map && cfg) {
      const targets = await resolveFilterTargets(map, cfg);
      clearFilter(targets);
    }
    clearActive();
  }

  const extra = active.values.length - MAX_SHOWN;

  return (
    <div className="filter-banner" role="status">
      <span className="fb-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4h18l-7 8v7l-4-2v-5L3 4Z" />
        </svg>
      </span>

      <span className="fb-label">{active.label}:</span>

      <span className="fb-values">
        {active.values.slice(0, MAX_SHOWN).map((v) => (
          <CalciteChip key={v} scale="s" appearance="outline-fill">
            {v}
          </CalciteChip>
        ))}
        {extra > 0 && <span className="fb-more">+{extra}</span>}
      </span>

      <span className="fb-scope">{t('filter.scope', { n: active.layerTitles.length })}</span>

      <CalciteAction
        icon="x"
        scale="s"
        appearance="transparent"
        text={t('filter.turnOff')}
        title={t('filter.turnOff')}
        onClick={turnOff}
      />
    </div>
  );
}
