/**
 * Herramientas de seleccion (RF-SEL-01). Solo elige COMO se selecciona: el
 * trabajo lo hace `MapInteractions`, que esta siempre montado. Asi la seleccion
 * sigue activa aunque se cierre este panel o la tabla.
 */
import {
  CalciteButton,
  CalciteNotice,
  CalciteSegmentedControl,
  CalciteSegmentedControlItem,
} from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useTableDockStore } from '@/store/useTableDockStore';
import { useSelectionRunStore } from '@/store/useSelectionRunStore';
import { useInteractionStore, type MapMode } from '@/store/useInteractionStore';
import { useI18n } from '@/i18n/useI18n';

const MODES: { value: MapMode; key: 'selection.click' | 'selection.rectangle' | 'selection.polygon' }[] = [
  { value: 'select-click', key: 'selection.click' },
  { value: 'select-rectangle', key: 'selection.rectangle' },
  { value: 'select-polygon', key: 'selection.polygon' },
];

export function SelectionTools() {
  const mode = useInteractionStore((s) => s.mode);
  const setMode = useInteractionStore((s) => s.setMode);
  const resetMode = useInteractionStore((s) => s.reset);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const selectedCount = useMapStore((s) => s.selectedFeatures.length);
  const openTab = useTableDockStore((s) => s.openTab);
  const runReset = useSelectionRunStore((s) => s.reset);
  const { busy, empty, truncated, total, count, error } = useSelectionRunStore();
  const { t } = useI18n();

  const active = MODES.find((m) => m.value === mode);

  return (
    <div className="panel-section">
      <CalciteSegmentedControl
        onCalciteSegmentedControlChange={(e: any) => setMode(e.target.value as MapMode)}
      >
        {MODES.map((m) => (
          <CalciteSegmentedControlItem
            key={m.value}
            value={m.value}
            checked={mode === m.value || undefined}
          >
            {t(m.key)}
          </CalciteSegmentedControlItem>
        ))}
      </CalciteSegmentedControl>

      {active ? (
        <CalciteNotice open icon="cursor-click" scale="s">
          <div slot="message">
            {mode === 'select-click' ? t('selection.hintClick') : t('selection.hintDraw')}
          </div>
        </CalciteNotice>
      ) : (
        <CalciteNotice open icon="information" scale="s">
          <div slot="message">{t('selection.modeOff')}</div>
        </CalciteNotice>
      )}

      <p className="muted">
        {busy ? t('selection.querying') : t('selection.count', { n: selectedCount })}
      </p>

      {truncated && !busy && (
        <CalciteNotice open kind="warning" icon scale="s">
          <div slot="message">{t('selection.truncated', { shown: count, total })}</div>
        </CalciteNotice>
      )}

      {empty && !busy && (
        <CalciteNotice open kind="info" icon scale="s">
          <div slot="message">{t('selection.noResults')}</div>
        </CalciteNotice>
      )}

      {error && !busy && (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="message">{error}</div>
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
            runReset();
            graphicsLayer?.removeAll();
          }}
        >
          {t('common.clear')}
        </CalciteButton>
        {active && (
          <CalciteButton
            appearance="outline"
            kind="neutral"
            iconStart="x"
            onClick={resetMode}
            title={t('selection.modeOffHint')}
          >
            {t('selection.stopMode')}
          </CalciteButton>
        )}
      </div>
    </div>
  );
}
