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
  CalciteLabel,
  CalciteNotice,
  CalciteOption,
  CalciteSelect,
} from '@esri/calcite-components-react';
import type { FilterConfig } from '@/types/config';
import { buildValueWhere } from '@/services/queryUtils';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';

export function FilterPanel() {
  const filters = useConfigStore((s) => s.config?.app.filters ?? []);
  const operationalUrl = useConfigStore((s) => s.config?.app.map.operationalServiceUrl);
  const map = useMapStore((s) => s.map);

  const [selectedFilterIdx, setSelectedFilterIdx] = useState(0);
  const [values, setValues] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filter = filters[selectedFilterIdx];

  // Carga los valores distintos del campo (RNF-PERF-03: limitado).
  useEffect(() => {
    if (!filter || !operationalUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fl = new FeatureLayer({ url: `${operationalUrl}/${filter.layerId}` });
    fl.queryFeatures({
      where: `${filter.field} IS NOT NULL`,
      outFields: [filter.field],
      returnDistinctValues: true,
      returnGeometry: false,
      orderByFields: [filter.field],
      num: 1000,
    })
      .then((res) => {
        if (cancelled) return;
        const distinct = Array.from(
          new Set(res.features.map((f) => String(f.attributes[filter.field])).filter(Boolean)),
        );
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
    return <p className="muted">No hay filtros configurados en app-config.json.</p>;
  }

  return (
    <div className="panel-section">
      <CalciteLabel>
        Capa / campo
        <CalciteSelect
          label="Filtro"
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
        {filter?.allowMultiple ? 'Seleccion multiple (IN)' : 'Seleccion individual'} ·{' '}
        {loading ? 'cargando valores...' : `${values.length} valores`}
      </p>

      {error && (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="message">{error}</div>
        </CalciteNotice>
      )}

      <CalciteChipGroup label="Valores">
        {values.slice(0, 300).map((v) => (
          <CalciteChip
            key={v}
            value={v}
            selected={selectedValues.includes(v) || undefined}
            scale="s"
            onClick={() => toggleValue(v)}
          >
            {v}
          </CalciteChip>
        ))}
      </CalciteChipGroup>

      <div className="panel-actions">
        <CalciteButton
          iconStart="filter"
          disabled={selectedValues.length === 0 || undefined}
          onClick={applyFilter}
        >
          Aplicar
        </CalciteButton>
        <CalciteButton appearance="outline" kind="neutral" iconStart="reset" onClick={clearFilter}>
          Limpiar
        </CalciteButton>
      </div>
    </div>
  );
}
