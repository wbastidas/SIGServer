/**
 * Configuracion del mapa base (seccion 3.2 · BasemapConfig). Controla la
 * visibilidad y la opacidad del servicio base (CartografiaN), sin depender de
 * AGOL/Portal. Muestra el tipo de publicacion (teselado/dinamico) informado.
 */
import { useState } from 'react';
import { CalciteLabel, CalciteSlider, CalciteSwitch } from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useI18n } from '@/i18n/useI18n';

export function BasemapConfig() {
  const basemapLayer = useMapStore((s) => s.basemapLayer);
  const basemapType = useConfigStore((s) => s.config?.app.map.basemapType);
  const { t } = useI18n();

  const [visible, setVisible] = useState(basemapLayer?.visible ?? true);
  const [opacity, setOpacity] = useState(Math.round((basemapLayer?.opacity ?? 1) * 100));

  function handleVisible(next: boolean) {
    setVisible(next);
    if (basemapLayer) basemapLayer.visible = next;
  }

  function handleOpacity(next: number) {
    setOpacity(next);
    if (basemapLayer) basemapLayer.opacity = next / 100;
  }

  if (!basemapLayer) {
    return <p className="muted">{t('common.loading')}</p>;
  }

  return (
    <div className="panel-section">
      <p className="muted">
        {t('basemap.type')}:{' '}
        {basemapType === 'tiled' ? t('basemap.tiled') : t('basemap.dynamic')}
      </p>

      <CalciteLabel layout="inline-space-between">
        {t('basemap.visible')}
        <CalciteSwitch
          checked={visible || undefined}
          onCalciteSwitchChange={(e: any) => handleVisible(e.target.checked)}
        />
      </CalciteLabel>

      <CalciteLabel>
        {t('basemap.opacity')}
        <CalciteSlider
          min={0}
          max={100}
          step={5}
          value={opacity}
          onCalciteSliderInput={(e: any) => handleOpacity(e.target.value)}
        />
      </CalciteLabel>
    </div>
  );
}
