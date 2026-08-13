/**
 * Herramientas de medicion (RF-MSR-01..03): distancia y area con componentes
 * web del SDK. Unidades configurables por JSON (RF-MSR-02). Boton para limpiar.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ArcgisAreaMeasurement2d,
  ArcgisDistanceMeasurement2d,
} from '@arcgis/map-components-react';
import { CalciteButton, CalciteSegmentedControl, CalciteSegmentedControlItem } from '@esri/calcite-components-react';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';

type Mode = 'distance' | 'area';

export function MeasureTools() {
  const measureCfg = useConfigStore((s) => s.config?.app.measure);
  const view = useMapStore((s) => s.view);
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('distance');
  const distRef = useRef<any>(null);
  const areaRef = useRef<any>(null);

  useEffect(() => {
    if (distRef.current && view) {
      distRef.current.view = view;
      if (measureCfg?.linearUnit) distRef.current.unit = measureCfg.linearUnit;
    }
  }, [view, measureCfg, mode]);

  useEffect(() => {
    if (areaRef.current && view) {
      areaRef.current.view = view;
      if (measureCfg?.areaUnit) areaRef.current.unit = measureCfg.areaUnit;
    }
  }, [view, measureCfg, mode]);

  function clear() {
    distRef.current?.clear?.();
    areaRef.current?.clear?.();
  }

  return (
    <div className="panel-section">
      <CalciteSegmentedControl
        onCalciteSegmentedControlChange={(e: any) => setMode(e.target.value)}
      >
        <CalciteSegmentedControlItem value="distance" checked={mode === 'distance' || undefined}>
          {t('measure.distance')}
        </CalciteSegmentedControlItem>
        <CalciteSegmentedControlItem value="area" checked={mode === 'area' || undefined}>
          {t('measure.area')}
        </CalciteSegmentedControlItem>
      </CalciteSegmentedControl>

      {/* Solo se monta la herramienta activa: evita dos widgets de medicion
          escuchando el mapa a la vez; cambiar de modo limpia la medicion previa. */}
      {mode === 'distance' && <ArcgisDistanceMeasurement2d ref={distRef} />}
      {mode === 'area' && <ArcgisAreaMeasurement2d ref={areaRef} />}

      <CalciteButton appearance="outline" kind="neutral" iconStart="trash" onClick={clear}>
        {t('measure.clear')}
      </CalciteButton>
    </div>
  );
}
