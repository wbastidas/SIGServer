/**
 * Conversion de coordenadas (RF-GOTO-04, opcional). Muestra la posicion del
 * cursor en varios formatos usando el componente web arcgis-coordinate-conversion,
 * enlazado al MapView del store. Respeta el SR del mapa configurado.
 */
import { useRef } from 'react';
import { ArcgisCoordinateConversion } from '@arcgis/map-components-react';
import { useBindView } from '@/components/common/useBindView';

export function CoordinateConversion() {
  const ref = useRef<any>(null);
  useBindView(ref);
  return (
    <div className="coordinate-conversion">
      <ArcgisCoordinateConversion ref={ref} />
    </div>
  );
}
