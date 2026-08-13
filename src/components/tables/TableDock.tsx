/**
 * Panel de tablas acoplado bajo el mapa (flotante, redimensionable y cerrable).
 *
 * Se saco del panel lateral porque las tablas necesitan ancho: aqui ocupan todo
 * el ancho del mapa sin tapar las herramientas. Tiene dos pestanas:
 *  - Seleccion: los elementos seleccionados, agrupados por capa (RF-SEL-02/03).
 *  - Tabla de capa: el widget FeatureTable con alcance visible / todo.
 */
import { useCallback, useEffect, useRef } from 'react';
import { CalciteAction } from '@esri/calcite-components-react';
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
        {/* Pestanas propias: mas predecibles que calcite-tabs, que gestiona su
            propio ciclo de vida y aqui solo necesitamos conmutar contenido. */}
        <nav className="table-dock-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'selection'}
            className={tab === 'selection' ? 'is-active' : undefined}
            onClick={() => openTab('selection')}
          >
            {t('panel.selection')}
            {selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'layer'}
            className={tab === 'layer' ? 'is-active' : undefined}
            onClick={() => openTab('layer')}
          >
            {t('panel.table')}
          </button>
        </nav>

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
