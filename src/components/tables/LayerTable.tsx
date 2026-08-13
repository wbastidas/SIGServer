/**
 * Tabla de una capa completa (widget FeatureTable del SDK), con alcance
 * "solo lo visible" (filtra por la extension del mapa y se actualiza al
 * navegar) o "ver todo". Vive dentro del panel acoplado bajo el mapa.
 */
import { useEffect, useRef, useState } from 'react';
import FeatureTable from '@arcgis/core/widgets/FeatureTable';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {
  CalciteInputText,
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
  const [where, setWhere] = useState('');

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

    // Importante: las capas derivadas de subcapas de un MapImageLayer NO estan
    // anadidas al mapa. Si a FeatureTable se le pasa `view` con una capa que no
    // esta en el mapa, no consigue su layerView y la tabla se queda vacia (era
    // el caso de "en la tabla no se visualiza nada"). Para esas capas se crea
    // la tabla sin `view`: los datos se muestran igual y el filtro por
    // extension se aplica a mano con `filterGeometry`.
    const table = new FeatureTable({
      ...(target.fromSublayer ? {} : { view, highlightEnabled: true }),
      layer: target.layer,
      container: hostRef.current,
      // La columna de seleccion permite marcar filas.
      visibleElements: { header: false, menu: true, selectionColumn: true },
      // Trae las filas por lotes en lugar de todo de golpe: con capas grandes
      // cargarlo todo bloqueaba el navegador (RNF-PERF-03).
      pageSize: 100,
    } as never);
    tableRef.current = table;

    const applyFilter = () => {
      table.filterGeometry = scope === 'visible' ? view.extent : (null as any);
    };
    applyFilter();
    // Filtro por atributos sobre la tabla (clausula WHERE del servicio).
    (table as any).filterBySelectionEnabled = false;
    if (where.trim()) {
      try {
        (table.layer as any).definitionExpression = where.trim();
      } catch {
        /* expresion invalida: se ignora hasta que el usuario la corrija */
      }
    } else {
      try {
        (table.layer as any).definitionExpression = null;
      } catch {
        /* nada que limpiar */
      }
    }

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
  }, [view, layers, selectedId, scope, where]);

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

        <CalciteLabel style={{ flex: '1 1 260px' }}>
          {t('table.filter')}
          <CalciteInputText
            scale="s"
            clearable
            placeholder={t('table.filterPlaceholder')}
            onCalciteInputTextChange={(e: any) => setWhere(e.target.value)}
          />
        </CalciteLabel>
      </div>

      <p className="muted layer-table-hint">
        {scope === 'visible' ? t('table.hintVisible') : t('table.hintAll')}
      </p>

      <div ref={hostRef} className="layer-table-host" />
    </>
  );
}
