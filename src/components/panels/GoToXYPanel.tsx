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

export function GoToXYPanel() {
  const gotoCfg = useConfigStore((s) => s.config?.app.goto);
  const mapWkid = useConfigStore((s) => s.config?.app.map.spatialReferenceWkid);
  const view = useMapStore((s) => s.view);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);

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
      return { ok: false, msg: 'Ingrese coordenadas numericas validas.' };
    }
    if (isLatLong) {
      if (ny < -90 || ny > 90) return { ok: false, msg: 'Latitud fuera de rango (-90 a 90).' };
      if (nx < -180 || nx > 180) return { ok: false, msg: 'Longitud fuera de rango (-180 a 180).' };
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
      setError(`No se pudo navegar: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-section">
      <CalciteLabel>
        Sistema de referencia de entrada
        <CalciteSelect
          label="SR de entrada"
          value={String(inputWkid)}
          onCalciteSelectChange={(e: any) => setInputWkid(Number(e.target.value))}
        >
          {allowed.map((wkid) => (
            <CalciteOption key={wkid} value={String(wkid)}>
              {wkid === 4326 ? 'Lat/Long (WGS84 · 4326)' : `Proyectado (WKID ${wkid})`}
            </CalciteOption>
          ))}
        </CalciteSelect>
      </CalciteLabel>

      <CalciteLabel>
        {isLatLong ? 'Longitud (X)' : 'X (Este)'}
        <CalciteInputNumber value={x} onCalciteInputNumberInput={(e: any) => setX(e.target.value)} />
      </CalciteLabel>

      <CalciteLabel>
        {isLatLong ? 'Latitud (Y)' : 'Y (Norte)'}
        <CalciteInputNumber value={y} onCalciteInputNumberInput={(e: any) => setY(e.target.value)} />
      </CalciteLabel>

      {error && (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="message">{error}</div>
        </CalciteNotice>
      )}

      <div className="panel-actions">
        <CalciteButton iconStart="pin" loading={busy || undefined} onClick={goTo}>
          Ir a la ubicacion
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
          Limpiar
        </CalciteButton>
      </div>
    </div>
  );
}
