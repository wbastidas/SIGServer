/**
 * Panel de filtros (RF-FIL-01..05). Filtra por un campo configurable (p. ej.
 * ALIMENTADORID). Soporta filtro individual y multiple (IN (...)). Aplica
 * definitionExpression a sublayers de MapImageLayer y featureEffect a FeatureLayer.
 * Capas/campos filtrables definidos en JSON (RF-FIL-05).
 */
import { useEffect, useMemo, useState } from 'react';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect';
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
import { buildValueWhere } from '@/services/queryUtils';
import { safeQueryFeatures } from '@/services/safeQuery';
import { getDomainMap, labelWithCode, type DomainMap } from '@/services/domainUtils';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';

export function FilterPanel() {
  const filters = useConfigStore((s) => s.config?.app.filters ?? []);
  const operationalUrl = useConfigStore((s) => s.config?.app.map.operationalServiceUrl);
  const map = useMapStore((s) => s.map);
  const { t } = useI18n();

  const [selectedFilterIdx, setSelectedFilterIdx] = useState(0);
  const [values, setValues] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState<DomainMap>({ codeToName: new Map(), hasDomain: false });
  const [valueSearch, setValueSearch] = useState('');

  const filter = filters[selectedFilterIdx];

  // Carga los valores distintos del campo (RNF-PERF-03: limitado).
  useEffect(() => {
    if (!filter || !operationalUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setValueSearch('');
    const fl = new FeatureLayer({ url: `${operationalUrl}/${filter.layerId}` });

    // Dominio del campo: permite mostrar la descripcion en lugar del codigo.
    getDomainMap(fl, filter.field)
      .then((d) => !cancelled && setDomain(d))
      .catch(() => undefined);

    // safeQueryFeatures respeta las capacidades del servicio: sin ellas, pedir
    // `num` o `returnDistinctValues` hace fallar la consulta con
    // "Pagination is not supported". La deduplicacion se hace en cliente.
    safeQueryFeatures(fl, {
      where: `${filter.field} IS NOT NULL`,
      outFields: [filter.field],
      returnDistinctValues: true,
      returnGeometry: false,
      orderByFields: [filter.field],
      limit: 2000,
    })
      .then((features) => {
        if (cancelled) return;
        const distinct = Array.from(
          new Set(features.map((f) => String(f.attributes[filter.field])).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setValues(distinct);
      })
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, operationalUrl]);

  const whereClause = useMemo(
    () => (filter ? buildValueWhere(filter.field, selectedValues) : ''),
    [filter, selectedValues],
  );

  // Valores filtrados por el buscador: busca tanto en el codigo como en la
  // descripcion del dominio, para que se pueda escribir cualquiera de los dos.
  const shownValues = useMemo(() => {
    const term = valueSearch.trim().toLowerCase();
    const matching = term
      ? values.filter((v) => labelWithCode(domain, v).toLowerCase().includes(term))
      : values;
    // Los seleccionados siempre visibles aunque no coincidan con la busqueda.
    const missingSelected = selectedValues.filter((v) => !matching.includes(v));
    return [...missingSelected, ...matching];
  }, [values, valueSearch, domain, selectedValues]);

  function toggleValue(value: string) {
    setSelectedValues((prev) => {
      if (!filter?.allowMultiple) return prev.includes(value) ? [] : [value];
      return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    });
  }

  function applyFilter() {
    if (!filter || !map) return;
    const where = whereClause;
    // MapImageLayer -> definitionExpression por sublayer.
    map.layers.forEach((layer: any) => {
      if (layer instanceof MapImageLayer) {
        const sub = layer.findSublayerById(filter.layerId);
        if (sub) sub.definitionExpression = where;
      } else if (layer instanceof FeatureLayer) {
        const matchesLayer = layer.url?.endsWith(`/${filter.layerId}`);
        if (matchesLayer) {
          // featureEffect resalta lo incluido y atenua el resto (RF-FIL-03).
          layer.featureEffect = where
            ? new FeatureEffect({
                filter: { where },
                excludedEffect: 'grayscale(100%) opacity(30%)',
                includedEffect: 'drop-shadow(0, 2px, 2px)',
              })
            : (null as any);
        }
      }
    });
  }

  function clearFilter() {
    if (!filter || !map) return;
    setSelectedValues([]);
    map.layers.forEach((layer: any) => {
      if (layer instanceof MapImageLayer) {
        const sub = layer.findSublayerById(filter.layerId);
        if (sub) sub.definitionExpression = '';
      } else if (layer instanceof FeatureLayer && layer.url?.endsWith(`/${filter.layerId}`)) {
        layer.featureEffect = null as any;
      }
    });
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
          value={String(selectedFilterIdx)}
          onCalciteSelectChange={(e: any) => {
            setSelectedFilterIdx(Number(e.target.value));
            setSelectedValues([]);
          }}
        >
          {filters.map((f: FilterConfig, idx: number) => (
            <CalciteOption key={idx} value={String(idx)}>
              {f.label ?? f.field} (capa {f.layerId})
            </CalciteOption>
          ))}
        </CalciteSelect>
      </CalciteLabel>

      <p className="muted">
        {filter?.allowMultiple ? t('filter.multiple') : t('filter.single')} ·{' '}
        {loading ? t('filter.loadingValues') : t('filter.valuesCount', { n: values.length })}
      </p>

      {error && (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="message">{error}</div>
        </CalciteNotice>
      )}

      <CalciteLabel>
        {t('filter.searchValues')}
        <CalciteInputText
          value={valueSearch}
          placeholder={t('filter.searchPlaceholder')}
          clearable
          onCalciteInputTextInput={(e: any) => setValueSearch(e.target.value)}
        />
      </CalciteLabel>

      {shownValues.length === 0 && !loading && (
        <p className="muted">{t('filter.noMatches')}</p>
      )}

      <CalciteChipGroup label={t('filter.values')}>
        {shownValues.slice(0, 300).map((v) => (
          <CalciteChip
            key={v}
            value={v}
            selected={selectedValues.includes(v) || undefined}
            scale="s"
            title={v}
            onClick={() => toggleValue(v)}
          >
            {/* Muestra la descripcion del dominio; el codigo queda entre parentesis. */}
            {labelWithCode(domain, v)}
          </CalciteChip>
        ))}
      </CalciteChipGroup>

      {shownValues.length > 300 && (
        <p className="muted">{t('filter.tooMany', { n: shownValues.length })}</p>
      )}

      <div className="panel-actions">
        <CalciteButton
          iconStart="filter"
          disabled={selectedValues.length === 0 || undefined}
          onClick={applyFilter}
        >
          {t('common.apply')}
        </CalciteButton>
        <CalciteButton appearance="outline" kind="neutral" iconStart="reset" onClick={clearFilter}>
          {t('common.clear')}
        </CalciteButton>
      </div>
    </div>
  );
}
