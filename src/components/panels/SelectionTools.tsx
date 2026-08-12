/**
 * Herramientas de seleccion (RF-SEL-01). Solo controla COMO se selecciona; los
 * resultados se muestran en el panel de tablas acoplado bajo el mapa, que se
 * abre automaticamente al obtener elementos.
 */
import { useEffect, useRef, useState } from 'react';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import {
  CalciteButton,
  CalciteNotice,
  CalciteSegmentedControl,
  CalciteSegmentedControlItem,
} from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useTableDockStore } from '@/store/useTableDockStore';
import { selectByClick, selectByGeometry } from '@/services/selectionService';
import { useI18n } from '@/i18n/useI18n';

type RemovableHandle = { remove: () => void };
type Mode = 'click' | 'rectangle' | 'polygon';

export function SelectionTools() {
  const view = useMapStore((s) => s.view);
  const sketchLayer = useMapStore((s) => s.sketchLayer);
  const setSelection = useMapStore((s) => s.setSelection);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const selectedCount = useMapStore((s) => s.selectedFeatures.length);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const openTab = useTableDockStore((s) => s.openTab);
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>('click');
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);
  const svmRef = useRef<SketchViewModel | null>(null);
  const clickHandle = useRef<RemovableHandle | null>(null);

  // Modo clic: consulta las capas visibles alrededor del punto pulsado. Funciona
  // con FeatureLayer y con subcapas de MapImageLayer.
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
          setSelection(result.byLayer);
          setEmpty(result.features.length === 0);
          if (result.features.length > 0) openTab('selection');
        } catch {
          setEmpty(true);
        } finally {
          setBusy(false);
        }
      }) as unknown as RemovableHandle;
    }
    return () => clickHandle.current?.remove?.();
  }, [view, mode, setSelection, openTab]);

  // Modo rectangulo/poligono.
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
      if (evt.state !== 'complete') return;
      const geometry = evt.graphic.geometry;
      sketchLayer.remove(evt.graphic);
      if (!geometry) return;
      setBusy(true);
      setEmpty(false);
      try {
        const result = await selectByGeometry(view, geometry);
        setSelection(result.byLayer);
        setEmpty(result.features.length === 0);
        if (result.features.length > 0) openTab('selection');
      } catch {
        setEmpty(true);
      } finally {
        setBusy(false);
      }
      svm.create(mode === 'rectangle' ? 'rectangle' : 'polygon');
    });
    svm.create(mode === 'rectangle' ? 'rectangle' : 'polygon');
    return () => {
      handle.remove();
      svm.destroy();
    };
  }, [view, sketchLayer, mode, setSelection, openTab]);

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

      <CalciteNotice open icon="cursor-click" scale="s">
        <div slot="message">
          {mode === 'click' ? t('selection.hintClick') : t('selection.hintDraw')}
        </div>
      </CalciteNotice>

      <p className="muted">
        {busy ? t('selection.querying') : t('selection.count', { n: selectedCount })}
      </p>

      {empty && !busy && (
        <CalciteNotice open kind="info" icon scale="s">
          <div slot="message">{t('selection.noResults')}</div>
        </CalciteNotice>
      )}

      <div className="panel-actions">
        <CalciteButton
          iconStart="table"
          disabled={selectedCount === 0 || undefined}
          onClick={() => openTab('selection')}
        >
          {t('selection.viewTable')}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          iconStart="trash"
          disabled={selectedCount === 0 || undefined}
          onClick={() => {
            clearSelection();
            graphicsLayer?.removeAll();
          }}
        >
          {t('common.clear')}
        </CalciteButton>
      </div>
    </div>
  );
}
