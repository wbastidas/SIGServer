/**
 * Herramientas de dibujo (RF-DRW-01..04) con el componente arcgis-sketch (motor
 * de dibujo mejorado 5.x). Los graficos residen en un GraphicsLayer separado
 * (RF-DRW-04) para no interferir con seleccion/consulta.
 */
import { useEffect, useRef } from 'react';
import { ArcgisSketch } from '@arcgis/map-components-react';
import { CalciteNotice } from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';

export function DrawTools() {
  const sketchRef = useRef<any>(null);
  const view = useMapStore((s) => s.view);
  const sketchLayer = useMapStore((s) => s.sketchLayer);
  const { t } = useI18n();

  useEffect(() => {
    const el = sketchRef.current;
    if (el && view && sketchLayer) {
      el.view = view;
      // Enlaza la capa de dibujo dedicada.
      el.layer = sketchLayer;
      // Habilita creacion de todas las geometrias + texto (RF-DRW-01/03).
      el.creationMode = 'update';
    }
  }, [view, sketchLayer]);

  return (
    <div className="panel-section">
      <CalciteNotice open icon="pencil" scale="s">
        <div slot="message">{t('draw.help')}</div>
      </CalciteNotice>
      <ArcgisSketch ref={sketchRef} />
    </div>
  );
}
