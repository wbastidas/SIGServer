/**
 * Tabla de una capa completa (widget FeatureTable del SDK), con alcance
 * "solo lo visible" (filtra por la extension del mapa y se actualiza al
 * navegar) o "ver todo". Vive dentro del panel acoplado bajo el mapa.
 */
import { useEffect, useRef, useState } from 'react';
import FeatureTable from '@arcgis/core/widgets/FeatureTable';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {
  CalciteLabel,
  CalciteOption,
  CalciteSegmentedControl,
  CalciteSegmentedControlItem,
  CalciteSelect,
} from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { getQueryableLayers, type QueryableLayer } from '@/services/layerRegistry';
import { useI18n } from '@/i18n/useI18n';

type Scope = 'visible' | 'all';

export function LayerTable() {
  const view = useMapStore((s) => s.view);
  const { t } = useI18n();

  const hostRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<FeatureTable | null>(null);
  const watchRef = useRef<{ remove: () => void } | null>(null);

  const [layers, setLayers] = useState<QueryableLayer[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [scope, setScope] = useState<Scope>('visible');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!view) return;
    let cancelled = false;
    setLoading(true);
    getQueryableLayers(view.map)
      .then((found) => {
        if (cancelled) return;
        setLayers(found);
        setSelectedId((prev) => prev || found[0]?.id || '');
      })
      .catch(() => !cancelled && setLayers([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [view]);

  useEffect(() => {
    const target = layers.find((l) => l.id === selectedId);
    if (!view || !hostRef.current || !target) return;

    tableRef.current?.destroy();
    watchRef.current?.remove();

    const table = new FeatureTable({
      view,
      layer: target.layer,
      container: hostRef.current,
      visibleElements: { header: false, menu: true, selectionColumn: false },
    });
    tableRef.current = table;

    const applyFilter = () => {
      table.filterGeometry = scope === 'visible' ? view.extent : (null as any);
    };
    applyFilter();

    if (scope === 'visible') {
      watchRef.current = reactiveUtils.watch(
        () => view.stationary && view.extent,
        (value: unknown) => {
          if (value) applyFilter();
        },
      );
    }

    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
      table.destroy();
      tableRef.current = null;
    };
  }, [view, layers, selectedId, scope]);

  if (loading) return <p className="muted">{t('table.loading')}</p>;
  if (layers.length === 0) return <p className="muted">{t('table.noLayers')}</p>;

  return (
    <>
      <div className="layer-table-controls">
        <CalciteLabel>
          {t('table.layer')}
          <CalciteSelect
            label={t('table.layer')}
            value={selectedId}
            onCalciteSelectChange={(e: any) => setSelectedId(e.target.value)}
          >
            {layers.map((l) => (
              <CalciteOption key={l.id} value={l.id}>
                {l.title}
              </CalciteOption>
            ))}
          </CalciteSelect>
        </CalciteLabel>

        <CalciteSegmentedControl
          scale="s"
          onCalciteSegmentedControlChange={(e: any) => setScope(e.target.value)}
        >
          <CalciteSegmentedControlItem value="visible" checked={scope === 'visible' || undefined}>
            {t('table.scopeVisible')}
          </CalciteSegmentedControlItem>
          <CalciteSegmentedControlItem value="all" checked={scope === 'all' || undefined}>
            {t('table.scopeAll')}
          </CalciteSegmentedControlItem>
        </CalciteSegmentedControl>
      </div>

      <div ref={hostRef} className="layer-table-host" />
    </>
  );
}
