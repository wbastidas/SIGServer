/**
 * Panel flotante de Google Street View (RF-GSV-01..04). Recuadro cerrable y
 * redimensionable (CSS resize) que no interrumpe el mapa. Si no hay panoramica
 * cercana muestra "sin cobertura"; si no hay clave/conexion degrada con mensaje.
 */
import { useEffect, useRef, useState } from 'react';
import { CalciteButton } from '@esri/calcite-components-react';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import { useConfigStore } from '@/store/useConfigStore';
import { loadGoogleMaps, getGoogleKey } from '@/services/googleStreetView';
import './streetview.css';

export function StreetViewPanel() {
  const { open, latitude, longitude, close } = useStreetViewStore();
  const enabled = useConfigStore((s) => s.config?.app.streetView.enabled);
  const panoRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'no-coverage' | 'unavailable'>(
    'loading',
  );

  useEffect(() => {
    if (!open || latitude == null || longitude == null) return;
    let cancelled = false;
    setStatus('loading');

    (async () => {
      if (!getGoogleKey()) {
        if (!cancelled) setStatus('unavailable');
        return;
      }
      const google = await loadGoogleMaps();
      if (cancelled) return;
      if (!google || !panoRef.current) {
        setStatus('unavailable');
        return;
      }
      const svService = new google.maps.StreetViewService();
      const location = { lat: latitude, lng: longitude };
      svService.getPanorama({ location, radius: 50 }, (data: any, svStatus: any) => {
        if (cancelled) return;
        if (svStatus === google.maps.StreetViewStatus.OK && data?.location?.pano) {
          setStatus('ok');
          new google.maps.StreetViewPanorama(panoRef.current!, {
            pano: data.location.pano,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: false,
          });
        } else {
          setStatus('no-coverage');
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, latitude, longitude]);

  if (!open || !enabled) return null;

  return (
    <div className="street-view-panel" role="dialog" aria-label="Google Street View">
      <div className="sv-header">
        <span>Google Street View</span>
        <CalciteButton
          appearance="transparent"
          kind="neutral"
          scale="s"
          iconStart="x"
          onClick={close}
          title="Cerrar"
        />
      </div>
      <div className="sv-body">
        <div ref={panoRef} className="sv-pano" style={{ display: status === 'ok' ? 'block' : 'none' }} />
        {status === 'loading' && <div className="sv-message">Cargando panoramica...</div>}
        {status === 'no-coverage' && (
          <div className="sv-message">No hay cobertura de Street View en este punto.</div>
        )}
        {status === 'unavailable' && (
          <div className="sv-message">
            Street View no disponible: falta la clave de Google (VITE_GOOGLE_MAPS_KEY) o no
            hay conexion a internet.
          </div>
        )}
      </div>
    </div>
  );
}
