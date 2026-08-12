/**
 * Seleccion de elementos y tabla (RF-SEL-01..05).
 *  - Seleccion por clic y por dibujo de rectangulo/poligono.
 *  - Los seleccionados se listan en una tabla.
 *  - Clic en una fila -> zoom/pan + resaltado (RF-SEL-03).
 *  - Sincronizacion mapa <-> tabla; exportacion CSV (RF-SEL-05).
 */
import { useEffect, useRef, useState } from 'react';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import type Graphic from '@arcgis/core/Graphic';

type RemovableHandle = { remove: () => void };
import {
  CalciteButton,
  CalciteNotice,
  CalciteSegmentedControl,
  CalciteSegmentedControlItem,
} from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { selectByClick, selectByGeometry, featuresToCsv } from '@/services/selectionService';
import { highlightAndZoom } from '@/services/highlightService';
import { useI18n } from '@/i18n/useI18n';

type Mode = 'click' | 'rectangle' | 'polygon';

export function SelectionTable() {
  const view = useMapStore((s) => s.view);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const sketchLayer = useMapStore((s) => s.sketchLayer);
  const selected = useMapStore((s) => s.selectedFeatures);
  const setSelected = useMapStore((s) => s.setSelectedFeatures);
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>('click');
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);
  const svmRef = useRef<SketchViewModel | null>(null);
  const clickHandle = useRef<RemovableHandle | null>(null);

  // Modo clic: consulta las capas visibles alrededor del punto pulsado
  // (funciona con FeatureLayer y con subcapas de MapImageLayer) (RF-SEL-01).
  useEffect(() => {
    if (!view) return;
    clickHandle.current?.remove?.();
    if (mode === 'click') {
      clickHandle.current = view.on('click', async (event) => {
        if (!event.mapPoint) return;
        setBusy(true);
        setEmpty(false);
        try {
          const result = await selectByClick(view, event.mapPoint);
          setSelected(result.features);
          setEmpty(result.features.length === 0);
        } catch {
          setEmpty(true);
        } finally {
          setBusy(false);
        }
      }) as unknown as RemovableHandle;
    }
    return () => clickHandle.current?.remove?.();
  }, [view, mode, setSelected]);

  // Modo rectangulo/poligono: dibuja y consulta por interseccion.
  useEffect(() => {
    if (!view || !sketchLayer) return;
    if (mode === 'click') {
      svmRef.current?.destroy();
      svmRef.current = null;
      return;
    }
    const svm = new SketchViewModel({ view, layer: sketchLayer });
    svmRef.current = svm;
    const handle = svm.on('create', async (evt) => {
      if (evt.state === 'complete') {
        const geometry = evt.graphic.geometry;
        sketchLayer.remove(evt.graphic);
        if (!geometry) return;
        setBusy(true);
        setEmpty(false);
        try {
          const result = await selectByGeometry(view, geometry);
          setSelected(result.features);
          setEmpty(result.features.length === 0);
        } catch {
          setEmpty(true);
        } finally {
          setBusy(false);
        }
        // Reinicia para otra seleccion.
        svm.create(mode === 'rectangle' ? 'rectangle' : 'polygon');
      }
    });
    svm.create(mode === 'rectangle' ? 'rectangle' : 'polygon');
    return () => {
      handle.remove();
      svm.destroy();
    };
  }, [view, sketchLayer, mode, setSelected]);

  async function focusFeature(feature: Graphic) {
    const geometry = feature.geometry;
    if (!view || !graphicsLayer || !geometry) return;
    await highlightAndZoom(view, graphicsLayer, geometry, {
      attributes: feature.attributes,
      openPopup: true,
    });
  }

  function exportCsv() {
    const csv = featuresToCsv(selected);
    if (!csv) return;
    // Prefijo BOM (\uFEFF) para que Excel detecte UTF-8 correctamente.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seleccion_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearSelection() {
    setSelected([]);
    graphicsLayer?.removeAll();
  }

  // Campos a mostrar en la tabla (los del primer elemento, hasta 6 columnas).
  const columns =
    selected.length > 0 ? Object.keys(selected[0].attributes ?? {}).slice(0, 6) : [];

  return (
    <div className="panel-section">
      <CalciteSegmentedControl
        onCalciteSegmentedControlChange={(e: any) => setMode(e.target.value)}
      >
        <CalciteSegmentedControlItem value="click" checked={mode === 'click' || undefined}>
          {t('selection.click')}
        </CalciteSegmentedControlItem>
        <CalciteSegmentedControlItem value="rectangle" checked={mode === 'rectangle' || undefined}>
          {t('selection.rectangle')}
        </CalciteSegmentedControlItem>
        <CalciteSegmentedControlItem value="polygon" checked={mode === 'polygon' || undefined}>
          {t('selection.polygon')}
        </CalciteSegmentedControlItem>
      </CalciteSegmentedControl>

      <p className="muted">
        {busy
          ? t('selection.querying')
          : t('selection.count', { n: selected.length })}
      </p>

      {empty && !busy && (
        <CalciteNotice open kind="info" icon scale="s">
          <div slot="message">{t('selection.noResults')}</div>
        </CalciteNotice>
      )}

      <div className="panel-actions">
        <CalciteButton
          appearance="outline"
          kind="neutral"
          iconStart="download"
          disabled={selected.length === 0 || undefined}
          onClick={exportCsv}
        >
          {t('selection.csv')}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          iconStart="trash"
          disabled={selected.length === 0 || undefined}
          onClick={clearSelection}
        >
          {t('common.clear')}
        </CalciteButton>
      </div>

      {selected.length > 0 && (
        <div className="selection-table-wrapper">
          <table className="selection-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.map((f, i) => (
                <tr key={i} onClick={() => focusFeature(f)} title={t('selection.goTo')}>
                  {columns.map((c) => (
                    <td key={c}>{String(f.attributes?.[c] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
