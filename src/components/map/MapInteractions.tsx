/**
 * Manejo unico y persistente de la interaccion con el mapa.
 *
 * Vive siempre montado junto al mapa, de modo que la seleccion, el identify y
 * la eleccion de punto para Street View siguen funcionando aunque se cierren
 * los paneles o la tabla (antes cada panel registraba su propio manejador y al
 * cerrarlo se dejaba de poder seleccionar).
 *
 * El modo activo lo decide `useInteractionStore`.
 */
import { useEffect, useRef } from 'react';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import { useMapStore } from '@/store/useMapStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import { useSelectionRunStore } from '@/store/useSelectionRunStore';
import { useTableDockStore } from '@/store/useTableDockStore';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import { selectByClick, selectByGeometry } from '@/services/selectionService';
import { identifyAt } from '@/services/identifyService';
import { toLatLong } from '@/services/projectionService';

type RemovableHandle = { remove: () => void };

export function MapInteractions() {
  const view = useMapStore((s) => s.view);
  const sketchLayer = useMapStore((s) => s.sketchLayer);
  const setSelection = useMapStore((s) => s.setSelection);
  const mode = useInteractionStore((s) => s.mode);
  const openTab = useTableDockStore((s) => s.openTab);
  const openStreetView = useStreetViewStore((s) => s.openAt);
  const run = useSelectionRunStore();

  const clickHandle = useRef<RemovableHandle | null>(null);
  const svmRef = useRef<SketchViewModel | null>(null);

  // --- Clic simple: identify, seleccion por clic o punto de Street View ---
  useEffect(() => {
    if (!view) return;
    clickHandle.current?.remove();

    const handle = view.on('click', async (event) => {
      if (!event.mapPoint) return;

      if (mode === 'streetview') {
        event.stopPropagation();
        const { latitude, longitude } = await toLatLong(event.mapPoint);
        openStreetView(latitude, longitude);
        return;
      }

      if (mode === 'identify') {
        // Popup unico con TODOS los elementos bajo el punto, de todas las capas.
        event.stopPropagation();
        try {
          const result = await identifyAt(view, event.mapPoint);
          if (result.features.length === 0) {
            view.closePopup();
            return;
          }
          view.openPopup({
            location: event.mapPoint,
            features: result.features,
            featureMenuOpen: result.features.length > 1,
          });
        } catch {
          /* identify best-effort */
        }
        return;
      }

      if (mode === 'select-click') {
        event.stopPropagation();
        run.start();
        try {
          const result = await selectByClick(view, event.mapPoint);
          setSelection(result.byLayer);
          run.finish(result.features.length, result.total, result.truncated);
          if (result.features.length > 0) openTab('selection');
        } catch (err) {
          run.fail((err as Error).message);
        }
      }
    });
    clickHandle.current = handle as unknown as RemovableHandle;

    return () => clickHandle.current?.remove();
    // `run` es estable (store de zustand); no se incluye para no re-registrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, mode, setSelection, openTab, openStreetView]);

  // --- Cursor segun el modo, para que se note que hay una accion activa ---
  useEffect(() => {
    if (!view?.container) return;
    const el = view.container as HTMLDivElement;
    el.style.cursor = mode === 'identify' ? '' : 'crosshair';
    return () => {
      el.style.cursor = '';
    };
  }, [view, mode]);

  // --- Seleccion dibujando rectangulo o poligono ---
  useEffect(() => {
    if (!view || !sketchLayer) return;
    const isDraw = mode === 'select-rectangle' || mode === 'select-polygon';
    if (!isDraw) {
      svmRef.current?.destroy();
      svmRef.current = null;
      return;
    }

    const tool = mode === 'select-rectangle' ? 'rectangle' : 'polygon';
    const svm = new SketchViewModel({ view, layer: sketchLayer });
    svmRef.current = svm;

    const handle = svm.on('create', async (evt) => {
      if (evt.state !== 'complete') return;
      const geometry = evt.graphic.geometry;
      sketchLayer.remove(evt.graphic);
      if (!geometry) return;
      run.start();
      try {
        const result = await selectByGeometry(view, geometry);
        setSelection(result.byLayer);
        run.finish(result.features.length, result.total, result.truncated);
        if (result.features.length > 0) openTab('selection');
      } catch (err) {
        run.fail((err as Error).message);
      }
      // Reinicia para permitir otra seleccion seguida.
      if (!svm.destroyed) svm.create(tool);
    });

    svm.create(tool);
    return () => {
      handle.remove();
      svm.destroy();
      svmRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, sketchLayer, mode, setSelection, openTab]);

  return null;
}
