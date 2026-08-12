/**
 * Tabla de atributos (RF-SEL-02) con el widget `FeatureTable` del SDK.
 *
 * Permite elegir la capa y el alcance:
 *  - "Solo lo visible": filtra por la extension actual del mapa y se
 *    actualiza al navegar.
 *  - "Ver todo": muestra todos los elementos de la capa.
 *
 * Funciona tambien cuando el servicio se carga como MapImageLayer, porque las
 * capas consultables se obtienen del registro (layerRegistry).
 */
import { useEffect, useRef, useState } from 'react';
import FeatureTable from '@arcgis/core/widgets/FeatureTable';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {
  CalciteLabel,
  CalciteNotice,
  CalciteOption,
  CalciteSegmentedControl,
  CalciteSegmentedControlItem,
  CalciteSelect,
} from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { getQueryableLayers, type QueryableLayer } from '@/services/layerRegistry';
import { useI18n } from '@/i18n/useI18n';
import './attribute-table.css';

type Scope = 'visible' | 'all';

export function AttributeTablePanel() {
  const view = useMapStore((s) => s.view);
  const { t } = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<FeatureTable | null>(null);
  const extentWatch = useRef<{ remove: () => void } | null>(null);

  const [layers, setLayers] = useState<QueryableLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [scope, setScope] = useState<Scope>('visible');
  const [loading, setLoading] = useState(true);

  // Carga las capas consultables del mapa.
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
      .catch(() => {
        if (!cancelled) setLayers([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [view]);

  // Crea/actualiza la tabla para la capa y alcance elegidos.
  useEffect(() => {
    const target = layers.find((l) => l.id === selectedId);
    if (!view || !containerRef.current || !target) return;

    tableRef.current?.destroy();
    extentWatch.current?.remove();

    const table = new FeatureTable({
      view,
      layer: target.layer,
      container: containerRef.current,
      visibleElements: {
        header: false,
        menu: true,
        selectionColumn: false,
      },
    });
    tableRef.current = table;

    const applyExtentFilter = () => {
      // filterGeometry limita las filas al area visible del mapa.
      table.filterGeometry = scope === 'visible' ? view.extent : (null as any);
    };
    applyExtentFilter();

    if (scope === 'visible') {
      extentWatch.current = reactiveUtils.watch(
        () => view.stationary && view.extent,
        (value: unknown) => {
          if (value) applyExtentFilter();
        },
      );
    }

    return () => {
      extentWatch.current?.remove();
      extentWatch.current = null;
      table.destroy();
      tableRef.current = null;
    };
  }, [view, layers, selectedId, scope]);

  if (loading) return <p className="muted">{t('table.loading')}</p>;
  if (layers.length === 0) return <p className="muted">{t('table.noLayers')}</p>;

  return (
    <div className="panel-section attribute-table-panel">
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
        onCalciteSegmentedControlChange={(e: any) => setScope(e.target.value)}
      >
        <CalciteSegmentedControlItem value="visible" checked={scope === 'visible' || undefined}>
          {t('table.scopeVisible')}
        </CalciteSegmentedControlItem>
        <CalciteSegmentedControlItem value="all" checked={scope === 'all' || undefined}>
          {t('table.scopeAll')}
        </CalciteSegmentedControlItem>
      </CalciteSegmentedControl>

      <CalciteNotice open icon="information" scale="s">
        <div slot="message">
          {scope === 'visible' ? t('table.hintVisible') : t('table.hintAll')}
        </div>
      </CalciteNotice>

      <div ref={containerRef} className="attribute-table-host" />
    </div>
  );
}
