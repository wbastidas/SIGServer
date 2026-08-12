/**
 * Herramienta Street View (RF-GSV): permite hacer clic en cualquier punto del
 * mapa para abrir Google Street View en esa ubicacion.
 *
 * Si no hay clave de Google configurada, Street View se abre en una ventana
 * emergente independiente del navegador (la URL publica de Google Maps no
 * requiere API key). Con clave, se incrusta en el panel flotante de la app.
 */
import { useEffect, useRef, useState } from 'react';
import { CalciteButton, CalciteNotice } from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import { toLatLong } from '@/services/projectionService';
import { getGoogleKey } from '@/services/googleStreetView';
import { useI18n } from '@/i18n/useI18n';

export function StreetViewTool() {
  const view = useMapStore((s) => s.view);
  const pickOnMap = useStreetViewStore((s) => s.pickOnMap);
  const setPickOnMap = useStreetViewStore((s) => s.setPickOnMap);
  const openAt = useStreetViewStore((s) => s.openAt);
  const { t } = useI18n();
  const handleRef = useRef<{ remove: () => void } | null>(null);
  const [lastPoint, setLastPoint] = useState<string | null>(null);

  useEffect(() => {
    if (!view || !pickOnMap) return;
    const handle = view.on('click', async (event) => {
      if (!event.mapPoint) return;
      event.stopPropagation(); // no abrir el popup del elemento al elegir punto
      const { latitude, longitude } = await toLatLong(event.mapPoint);
      setLastPoint(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      openAt(latitude, longitude);
    });
    handleRef.current = handle as unknown as { remove: () => void };
    // Cursor de "seleccion" mientras el modo esta activo.
    if (view.container) view.container.style.cursor = 'crosshair';
    return () => {
      handleRef.current?.remove();
      handleRef.current = null;
      if (view.container) view.container.style.cursor = '';
    };
  }, [view, pickOnMap, openAt]);

  // Desactiva el modo al salir del panel.
  useEffect(() => () => setPickOnMap(false), [setPickOnMap]);

  return (
    <div className="panel-section">
      {!getGoogleKey() && (
        <CalciteNotice open icon="information" scale="s">
          <div slot="message">{t('sv.noKeyHint')}</div>
        </CalciteNotice>
      )}

      <CalciteButton
        iconStart={pickOnMap ? 'x' : 'road-sign'}
        kind={pickOnMap ? 'danger' : 'brand'}
        onClick={() => setPickOnMap(!pickOnMap)}
      >
        {pickOnMap ? t('sv.pickOnMapActive') : t('sv.pickOnMap')}
      </CalciteButton>

      {pickOnMap && (
        <CalciteNotice open icon="cursor-click" scale="s">
          <div slot="message">{t('sv.pickHint')}</div>
        </CalciteNotice>
      )}

      {lastPoint && <p className="muted">{lastPoint}</p>}
    </div>
  );
}
