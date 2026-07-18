/**
 * Ir a una ubicacion (RF-GOTO-01..04). Ingreso de X,Y en el SR del mapa o en
 * un SR configurable, y de Lat/Long (WGS84) con reproyeccion automatica al SR
 * del mapa (motor de proyeccion del SDK). Valida rangos y muestra errores claros.
 */
import { useState } from 'react';
import Graphic from '@arcgis/core/Graphic';
import {
  CalciteButton,
  CalciteInputNumber,
  CalciteLabel,
  CalciteNotice,
  CalciteOption,
  CalciteSelect,
} from '@esri/calcite-components-react';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { pointFromXY, pointFromLatLong } from '@/services/projectionService';
import { useI18n } from '@/i18n/useI18n';

export function GoToXYPanel() {
  const gotoCfg = useConfigStore((s) => s.config?.app.goto);
  const mapWkid = useConfigStore((s) => s.config?.app.map.spatialReferenceWkid);
  const view = useMapStore((s) => s.view);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const { t } = useI18n();

  const [inputWkid, setInputWkid] = useState<number>(gotoCfg?.defaultInputSR ?? mapWkid ?? 4326);
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLatLong = inputWkid === 4326;
  const allowed = gotoCfg?.allowedInputSR ?? [mapWkid ?? 4326];

  function validate(): { ok: boolean; msg?: string } {
    const nx = Number(x);
    const ny = Number(y);
    if (x === '' || y === '' || Number.isNaN(nx) || Number.isNaN(ny)) {
      return { ok: false, msg: t('goto.errNumeric') };
    }
    if (isLatLong) {
      if (ny < -90 || ny > 90) return { ok: false, msg: t('goto.errLat') };
      if (nx < -180 || nx > 180) return { ok: false, msg: t('goto.errLong') };
    }
    return { ok: true };
  }

  async function goTo() {
    setError(null);
    const v = validate();
    if (!v.ok) {
      setError(v.msg ?? 'Datos invalidos');
      return;
    }
    if (!view || !mapWkid) return;
    setBusy(true);
    try {
      const nx = Number(x);
      const ny = Number(y);
      const point = isLatLong
        ? await pointFromLatLong(ny, nx, mapWkid) // lat=y, long=x
        : await pointFromXY(nx, ny, inputWkid, mapWkid);

      graphicsLayer?.removeAll();
      graphicsLayer?.add(
        new Graphic({
          geometry: point,
          symbol: {
            type: 'simple-marker',
            style: 'diamond',
            color: gotoCfg?.markerColor ?? [255, 128, 0],
            size: 14,
            outline: { color: [255, 255, 255], width: 1.5 },
          } as any,
        }),
      );
      await view.goTo({ target: point, scale: 2000 });
    } catch (err) {
      setError(t('goto.errNav', { msg: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-section">
      <CalciteLabel>
        {t('goto.inputSR')}
        <CalciteSelect
          label={t('goto.inputSR')}
          value={String(inputWkid)}
          onCalciteSelectChange={(e: any) => setInputWkid(Number(e.target.value))}
        >
          {allowed.map((wkid) => (
            <CalciteOption key={wkid} value={String(wkid)}>
              {wkid === 4326 ? t('goto.latlong') : t('goto.projected', { wkid })}
            </CalciteOption>
          ))}
        </CalciteSelect>
      </CalciteLabel>

      <CalciteLabel>
        {isLatLong ? t('goto.longitudeX') : t('goto.xEast')}
        <CalciteInputNumber value={x} onCalciteInputNumberInput={(e: any) => setX(e.target.value)} />
      </CalciteLabel>

      <CalciteLabel>
        {isLatLong ? t('goto.latitudeY') : t('goto.yNorth')}
        <CalciteInputNumber value={y} onCalciteInputNumberInput={(e: any) => setY(e.target.value)} />
      </CalciteLabel>

      {error && (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="message">{error}</div>
        </CalciteNotice>
      )}

      <div className="panel-actions">
        <CalciteButton iconStart="pin" loading={busy || undefined} onClick={goTo}>
          {t('goto.go')}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          onClick={() => {
            setX('');
            setY('');
            setError(null);
            graphicsLayer?.removeAll();
          }}
        >
          {t('common.clear')}
        </CalciteButton>
      </div>
    </div>
  );
}
