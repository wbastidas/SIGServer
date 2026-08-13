/**
 * Herramienta Street View (RF-GSV): activa el modo "elegir punto en el mapa".
 * El clic lo atiende `MapInteractions`; aqui solo se conmuta el modo y se
 * informa del estado.
 *
 * Sin clave de Google, Street View se abre en una ventana emergente del
 * navegador y se REUTILIZA la misma al elegir otro punto. Mientras esta abierta,
 * el mapa muestra un muneco en la ubicacion que se esta viendo.
 */
import { useEffect } from 'react';
import { CalciteButton, CalciteNotice } from '@esri/calcite-components-react';
import { useStreetViewStore } from '@/store/useStreetViewStore';
import { useInteractionStore } from '@/store/useInteractionStore';
import { getGoogleKey } from '@/services/googleStreetView';
import { useI18n } from '@/i18n/useI18n';

export function StreetViewTool() {
  const mode = useInteractionStore((s) => s.mode);
  const setMode = useInteractionStore((s) => s.setMode);
  const resetMode = useInteractionStore((s) => s.reset);
  const { open, latitude, longitude, close } = useStreetViewStore();
  const { t } = useI18n();

  const picking = mode === 'streetview';

  // Al salir del panel se vuelve al modo por defecto.
  useEffect(
    () => () => {
      if (useInteractionStore.getState().mode === 'streetview') {
        useInteractionStore.getState().reset();
      }
    },
    [],
  );

  return (
    <div className="panel-section">
      {!getGoogleKey() && (
        <CalciteNotice open icon="information" scale="s">
          <div slot="message">{t('sv.noKeyHint')}</div>
        </CalciteNotice>
      )}

      <CalciteButton
        iconStart={picking ? 'x' : 'road-sign'}
        kind={picking ? 'danger' : 'brand'}
        onClick={() => (picking ? resetMode() : setMode('streetview'))}
      >
        {picking ? t('sv.pickOnMapActive') : t('sv.pickOnMap')}
      </CalciteButton>

      {picking && (
        <CalciteNotice open icon="cursor-click" scale="s">
          <div slot="message">{t('sv.pickHint')}</div>
        </CalciteNotice>
      )}

      {open && latitude != null && longitude != null && (
        <>
          <p className="muted">
            {t('sv.currentPoint', {
              lat: latitude.toFixed(6),
              lng: longitude.toFixed(6),
            })}
          </p>
          <CalciteButton
            appearance="outline"
            kind="neutral"
            iconStart="x"
            onClick={close}
          >
            {t('sv.closeAndRemove')}
          </CalciteButton>
        </>
      )}
    </div>
  );
}
