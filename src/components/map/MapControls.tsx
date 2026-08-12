/**
 * Controles del mapa: zoom (RF-MAP-04) y "ir a mi ubicacion" (RF-MAP-05).
 *
 * Los botones +/- se implementan directamente contra el MapView del store en
 * lugar de delegar en `arcgis-zoom`. Motivo: el componente web depende de que
 * se le enlace la vista y de los niveles LOD del basemap; si el basemap no
 * aporta esquema de teselas (caso habitual al fijar un SR propio), los botones
 * quedaban inertes. Con `goTo({ scale })` el acercar/alejar responde siempre.
 */
import { useEffect, useRef, useState } from 'react';
import { ArcgisLocate } from '@arcgis/map-components-react';
import { CalciteAction } from '@esri/calcite-components-react';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { useBindView } from '@/components/common/useBindView';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';

/** Factor de acercamiento por pulsacion. */
const ZOOM_FACTOR = 2;

export function MapControls() {
  const locateRef = useRef<any>(null);
  useBindView(locateRef);

  const view = useMapStore((s) => s.view);
  const { t } = useI18n();
  const [limits, setLimits] = useState({ canIn: true, canOut: true });

  // Desactiva los botones cuando se alcanza un limite de escala configurado.
  useEffect(() => {
    if (!view) return;
    const handle = reactiveUtils.watch(
      () => view.scale,
      (scale: number) => {
        const min = view.constraints?.minScale ?? 0;
        const max = view.constraints?.maxScale ?? 0;
        setLimits({
          canIn: max === 0 || scale > max,
          canOut: min === 0 || scale < min,
        });
      },
      { initial: true },
    );
    return () => handle.remove();
  }, [view]);

  function zoomBy(factor: number) {
    if (!view) return;
    const target = view.scale * factor;
    // `goTo` anima el desplazamiento, pero falla si la vista aun no esta "ready"
    // (p. ej. si el basemap no llego a cargar). En ese caso se asigna la escala
    // directamente, que si funciona: asi acercar/alejar responde SIEMPRE.
    view
      .goTo({ scale: target })
      .catch(() => {
        try {
          view.scale = target;
        } catch {
          /* vista destruida */
        }
      });
  }

  return (
    <div className="map-controls">
      <CalciteAction
        icon="plus"
        text={t('map.zoomIn')}
        scale="m"
        disabled={!view || !limits.canIn || undefined}
        onClick={() => zoomBy(1 / ZOOM_FACTOR)}
      />
      <CalciteAction
        icon="minus"
        text={t('map.zoomOut')}
        scale="m"
        disabled={!view || !limits.canOut || undefined}
        onClick={() => zoomBy(ZOOM_FACTOR)}
      />
      {/* RF-MAP-05: centra el mapa en la posicion GPS del dispositivo. */}
      <ArcgisLocate ref={locateRef} />
    </div>
  );
}
