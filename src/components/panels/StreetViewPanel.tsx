/**
 * Panel flotante de Google Street View (RF-GSV-01..04). Recuadro cerrable y
 * redimensionable (CSS resize) que no interrumpe el mapa. Si no hay panoramica
 * cercana muestra "sin cobertura"; si no hay clave/conexion degrada con mensaje.
 */
import { useEffect, useRef, useState } from 'react';
import { CalciteButton } from '@esri/calcite-components-react';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import { useConfigStore } from '@/store/useConfigStore';
import { loadGoogleMaps, getGoogleKey, streetViewUrl } from '@/services/googleStreetView';
import { useI18n } from '@/i18n/useI18n';
import './streetview.css';

export function StreetViewPanel() {
  const { open, latitude, longitude, close, popupBlocked } = useStreetViewStore();
  const enabled = useConfigStore((s) => s.config?.app.streetView.enabled);
  const { t } = useI18n();
  const panoRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'no-coverage' | 'unavailable'>(
    'loading',
  );

  useEffect(() => {
    // Sin clave el panorama no se incrusta: el panel solo aparece si la ventana
    // emergente fue bloqueada, para ofrecer el enlace manual.
    if (popupBlocked) return;
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
  }, [open, latitude, longitude, popupBlocked]);

  if (!open || !enabled) return null;

  return (
    <div className="street-view-panel" role="dialog" aria-label="Google Street View">
      <div className="sv-header">
        <span>{t('sv.title')}</span>
        <CalciteButton
          appearance="transparent"
          kind="neutral"
          scale="s"
          iconStart="x"
          onClick={close}
          title={t('sv.close')}
        />
      </div>
      <div className="sv-body">
        {popupBlocked ? (
          // Sin clave de Google se abre una ventana emergente; si el navegador
          // la bloquea, ofrecemos el enlace para abrirla manualmente.
          <div className="sv-message">
            <p>{t('sv.popupBlocked')}</p>
            {latitude != null && longitude != null && (
              <a
                className="sv-link"
                href={streetViewUrl(latitude, longitude)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('sv.openInGoogle')}
              </a>
            )}
          </div>
        ) : (
          <>
            <div
              ref={panoRef}
              className="sv-pano"
              style={{ display: status === 'ok' ? 'block' : 'none' }}
            />
            {status === 'loading' && <div className="sv-message">{t('sv.loading')}</div>}
            {status === 'no-coverage' && <div className="sv-message">{t('sv.noCoverage')}</div>}
            {status === 'unavailable' && <div className="sv-message">{t('sv.unavailable')}</div>}
          </>
        )}
      </div>
    </div>
  );
}
