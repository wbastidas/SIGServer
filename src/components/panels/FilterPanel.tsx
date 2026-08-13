/**
 * Panel de filtros (RF-FIL-01..05).
 *
 * El filtro se define por CAMPO y se aplica a TODAS las capas que lo publiquen:
 * el alimentador es `ALIMENTADORID` en la mayoria de capas y `ALIMENTADOR` solo
 * en postes, y un unico filtro debe afectar a todas a la vez.
 *
 * El filtro activo se anuncia sobre el mapa (FilterBanner) para que se vea
 * aunque este panel este cerrado, y se puede apagar desde ambos sitios.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalciteButton,
  CalciteChip,
  CalciteChipGroup,
  CalciteInputText,
  CalciteLabel,
  CalciteNotice,
  CalciteOption,
  CalciteSelect,
} from '@esri/calcite-components-react';
import type { FilterConfig } from '@/types/config';
import {
  applyFilter,
  clearFilter,
  collectFilterValues,
  filterFields,
  filterLabel,
  resolveFilterTargets,
  type FilterTarget,
} from '@/services/filterService';
import { getDomainMap, labelWithCode, type DomainMap } from '@/services/domainUtils';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { useFilterStore } from '@/store/useFilterStore';
import { useI18n } from '@/i18n/useI18n';

const MAX_CHIPS = 300;

export function FilterPanel() {
  const filters = useConfigStore((s) => s.config?.app.filters ?? []);
  const map = useMapStore((s) => s.map);
  const setActive = useFilterStore((s) => s.setActive);
  const active = useFilterStore((s) => s.active);
  const { t } = useI18n();

  const [index, setIndex] = useState(0);
  const [targets, setTargets] = useState<FilterTarget[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [domain, setDomain] = useState<DomainMap>({ codeToName: new Map(), hasDomain: false });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filter: FilterConfig | undefined = filters[index];
  const filterId = filter?.id ?? String(index);

  // Descubre las capas afectadas y sus valores.
  useEffect(() => {
    if (!filter || !map) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSearch('');
    setValues([]);
    setTargets([]);

    (async () => {
      try {
        const found = await resolveFilterTargets(map, filter);
        if (cancelled) return;
        setTargets(found);

        if (found.length === 0) {
          setError(t('filter.noLayersWithField', { fields: filterFields(filter).join(', ') }));
          return;
        }

        // El dominio se lee de la primera capa afectada: sirve para mostrar la
        // descripcion en lugar del codigo.
        getDomainMap(found[0].queryLayer, found[0].field)
          .then((d) => !cancelled && setDomain(d))
          .catch(() => undefined);

        const distinct = await collectFilterValues(found);
        if (!cancelled) setValues(distinct);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filter, map, t]);

  // Refleja el filtro ya activo al reabrir el panel.
  useEffect(() => {
    if (active?.id === filterId) setSelected(active.values);
    else setSelected([]);
  }, [active, filterId]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matching = term
      ? values.filter((v) => labelWithCode(domain, v).toLowerCase().includes(term))
      : values;
    const missing = selected.filter((v) => !matching.includes(v));
    return [...missing, ...matching];
  }, [values, search, domain, selected]);

  const toggleValue = useCallback(
    (value: string) => {
      setSelected((prev) => {
        if (!filter?.allowMultiple) return prev.includes(value) ? [] : [value];
        return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      });
    },
    [filter],
  );

  function handleApply() {
    if (!filter || targets.length === 0 || selected.length === 0) return;
    applyFilter(targets, selected);
    setActive({
      id: filterId,
      label: filterLabel(filter),
      values: selected,
      layerTitles: targets.map((x) => x.title),
    });
  }

  function handleClear() {
    clearFilter(targets);
    setSelected([]);
    useFilterStore.getState().clear();
  }

  if (filters.length === 0) {
    return <p className="muted">{t('filter.noConfig')}</p>;
  }

  return (
    <div className="panel-section">
      <CalciteLabel>
        {t('filter.layerField')}
        <CalciteSelect
          label={t('filter.layerField')}
          value={String(index)}
          onCalciteSelectChange={(e: any) => setIndex(Number(e.target.value))}
        >
          {filters.map((f, i) => (
            <CalciteOption key={f.id ?? i} value={String(i)}>
              {filterLabel(f)}
            </CalciteOption>
          ))}
        </CalciteSelect>
      </CalciteLabel>

      {/* Alcance: que capas quedan afectadas por este filtro. */}
      {targets.length > 0 && (
        <p className="muted">
          {t('filter.scope', { n: targets.length })}{' '}
          <span title={targets.map((x) => `${x.title} (${x.field})`).join('\n')}>
            {targets
              .slice(0, 4)
              .map((x) => x.title)
              .join(', ')}
            {targets.length > 4 ? '…' : ''}
          </span>
        </p>
      )}

      <p className="muted">
        {filter?.allowMultiple ? t('filter.multiple') : t('filter.single')} ·{' '}
        {loading ? t('filter.loadingValues') : t('filter.valuesCount', { n: values.length })}
      </p>

      {error && (
        <CalciteNotice open kind="warning" icon scale="s">
          <div slot="message">{error}</div>
        </CalciteNotice>
      )}

      <CalciteLabel>
        {t('filter.searchValues')}
        <CalciteInputText
          value={search}
          placeholder={t('filter.searchPlaceholder')}
          clearable
          onCalciteInputTextInput={(e: any) => setSearch(e.target.value)}
        />
      </CalciteLabel>

      {!loading && shown.length === 0 && values.length > 0 && (
        <p className="muted">{t('filter.noMatches')}</p>
      )}

      <CalciteChipGroup label={t('filter.values')}>
        {shown.slice(0, MAX_CHIPS).map((v) => (
          <CalciteChip
            key={v}
            value={v}
            selected={selected.includes(v) || undefined}
            scale="s"
            title={v}
            onClick={() => toggleValue(v)}
          >
            {labelWithCode(domain, v)}
          </CalciteChip>
        ))}
      </CalciteChipGroup>

      {shown.length > MAX_CHIPS && (
        <p className="muted">{t('filter.tooMany', { n: shown.length })}</p>
      )}

      <div className="panel-actions">
        <CalciteButton
          iconStart="filter"
          disabled={selected.length === 0 || targets.length === 0 || undefined}
          onClick={handleApply}
        >
          {t('common.apply')}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          iconStart="reset"
          disabled={(!active && selected.length === 0) || undefined}
          onClick={handleClear}
        >
          {t('filter.turnOff')}
        </CalciteButton>
      </div>
    </div>
  );
}
