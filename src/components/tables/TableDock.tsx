/**
 * Panel de tablas acoplado bajo el mapa (flotante, redimensionable y cerrable).
 *
 * Se saco del panel lateral porque las tablas necesitan ancho: aqui ocupan todo
 * el ancho del mapa sin tapar las herramientas. Tiene dos pestanas:
 *  - Seleccion: los elementos seleccionados, agrupados por capa (RF-SEL-02/03).
 *  - Tabla de capa: el widget FeatureTable con alcance visible / todo.
 */
import { useCallback, useEffect, useRef } from 'react';
import { CalciteAction, CalciteTab, CalciteTabNav, CalciteTabTitle, CalciteTabs } from '@esri/calcite-components-react';
import { useTableDockStore } from '@/store/useTableDockStore';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';
import { SelectionResults } from './SelectionResults';
import { LayerTable } from './LayerTable';
import './table-dock.css';

export function TableDock() {
  const { open, tab, height, openTab, close, setHeight } = useTableDockStore();
  const selectedCount = useMapStore((s) => s.selectedFeatures.length);
  const { t } = useI18n();
  const dragState = useRef<{ startY: number; startH: number } | null>(null);

  // Redimensionado arrastrando el borde superior.
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current) return;
      const delta = dragState.current.startY - e.clientY;
      setHeight(dragState.current.startH + delta);
    },
    [setHeight],
  );

  const onPointerUp = useCallback(() => {
    dragState.current = null;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  function startResize(e: React.PointerEvent) {
    dragState.current = { startY: e.clientY, startH: height };
    document.body.style.userSelect = 'none';
  }

  if (!open) return null;

  return (
    <section
      className="table-dock"
      style={{ height }}
      aria-label={t('panel.table')}
    >
      <div
        className="table-dock-resizer"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="horizontal"
        title={t('table.resize')}
      />

      <header className="table-dock-head">
        <CalciteTabs>
          <CalciteTabNav slot="title-group">
            <CalciteTabTitle
              selected={tab === 'selection' || undefined}
              onCalciteTabsActivate={() => openTab('selection')}
            >
              {t('panel.selection')}
              {selectedCount > 0 ? ` (${selectedCount})` : ''}
            </CalciteTabTitle>
            <CalciteTabTitle
              selected={tab === 'layer' || undefined}
              onCalciteTabsActivate={() => openTab('layer')}
            >
              {t('panel.table')}
            </CalciteTabTitle>
          </CalciteTabNav>
          <CalciteTab />
          <CalciteTab />
        </CalciteTabs>

        <CalciteAction
          icon="chevron-down"
          text={t('selection.collapse')}
          scale="s"
          onClick={close}
        />
      </header>

      <div className="table-dock-body">
        {tab === 'selection' ? <SelectionResults /> : <LayerTable />}
      </div>
    </section>
  );
}
