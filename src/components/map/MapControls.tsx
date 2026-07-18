/**
 * Controles del mapa como componentes web del SDK (no widgets deprecados):
 * zoom (RF-MAP-04) y "ir a mi ubicacion" (RF-MAP-05). Se enlazan al MapView
 * del store via propiedad `.view`.
 */
import { useRef } from 'react';
import { ArcgisZoom, ArcgisLocate } from '@arcgis/map-components-react';
import { useBindView } from '@/components/common/useBindView';

export function MapControls() {
  const zoomRef = useRef<any>(null);
  const locateRef = useRef<any>(null);
  useBindView(zoomRef);
  useBindView(locateRef);

  return (
    <div className="map-controls">
      <ArcgisZoom ref={zoomRef} />
      {/* RF-MAP-05: centra el mapa en la posicion GPS (reproyectada al SR del mapa por el SDK). */}
      <ArcgisLocate ref={locateRef} />
    </div>
  );
}
