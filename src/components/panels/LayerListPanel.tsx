/**
 * Panel de capas (RF-LYR-01..04):
 *  - Lista de capas/subcapas con casillas de encendido/apagado (arcgis-layer-list).
 *  - Control de opacidad por capa.
 *  - Leyenda/simbologia por capa (arcgis-legend), respetando visibilidad.
 * La visibilidad inicial la define el JSON (RF-LYR-04, aplicada en mapFactory).
 */
import { useEffect, useRef, useState } from 'react';
import { ArcgisLayerList, ArcgisLegend } from '@arcgis/map-components-react';
import { CalciteBlock, CalciteLabel, CalciteSlider } from '@esri/calcite-components-react';
import { useBindView } from '@/components/common/useBindView';
import { useMapStore } from '@/store/useMapStore';

export function LayerListPanel() {
  const listRef = useRef<any>(null);
  const legendRef = useRef<any>(null);
  useBindView(listRef);
  useBindView(legendRef);

  const map = useMapStore((s) => s.map);
  const [opacities, setOpacities] = useState<Record<string, number>>({});

  // Configura el layer list para mostrar controles de visibilidad de subcapas.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.visibilityAppearance = 'checkbox';
    }
  }, []);

  // Capas operacionales (excluye graficos/dibujo, que estan en listMode 'hide').
  const operational = (map?.layers?.toArray() ?? []).filter(
    (l: any) => l.listMode !== 'hide',
  );

  function handleOpacity(layerId: string, value: number) {
    const layer = map?.findLayerById(layerId);
    if (layer) layer.opacity = value / 100;
    setOpacities((prev) => ({ ...prev, [layerId]: value }));
  }

  return (
    <div className="panel-section">
      <ArcgisLayerList ref={listRef} />

      <CalciteBlock heading="Opacidad por capa" open collapsible={false}>
        {operational.map((layer: any) => (
          <CalciteLabel key={layer.id} layout="default">
            {layer.title ?? layer.id}
            <CalciteSlider
              min={0}
              max={100}
              step={5}
              value={opacities[layer.id] ?? Math.round((layer.opacity ?? 1) * 100)}
              onCalciteSliderInput={(e: any) => handleOpacity(layer.id, e.target.value)}
            />
          </CalciteLabel>
        ))}
        {operational.length === 0 && <p className="muted">Cargando capas...</p>}
      </CalciteBlock>

      <CalciteBlock heading="Leyenda" open collapsible>
        <ArcgisLegend ref={legendRef} />
      </CalciteBlock>
    </div>
  );
}
