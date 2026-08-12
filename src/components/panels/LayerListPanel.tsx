/**
 * Panel de capas (RF-LYR-01..04):
 *  - Lista de capas/subcapas con casillas de encendido/apagado (arcgis-layer-list).
 *  - Control de opacidad por capa.
 *  - Leyenda/simbologia por capa (arcgis-legend), respetando visibilidad.
 * La visibilidad inicial la define el JSON (RF-LYR-04, aplicada en mapFactory).
 */
import { useEffect, useRef, useState } from 'react';
import { ArcgisLayerList, ArcgisLegend } from '@arcgis/map-components-react';
import {
  CalciteBlock,
  CalciteLabel,
  CalciteNotice,
  CalciteSlider,
} from '@esri/calcite-components-react';
import { useBindView } from '@/components/common/useBindView';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';

/**
 * Obtiene la extension de una capa o subcapa. Las subcapas de MapImageLayer no
 * siempre publican `fullExtent`, asi que se consulta la extension real de los
 * datos como respaldo.
 */
async function resolveExtent(target: any): Promise<__esri.Extent | null> {
  if (typeof target.load === 'function') {
    await target.load().catch(() => undefined);
  }
  if (target.fullExtent) return target.fullExtent;
  if (typeof target.createFeatureLayer === 'function') {
    const fl = await Promise.resolve(target.createFeatureLayer());
    await fl.load();
    if (fl.fullExtent) return fl.fullExtent;
    const res = await fl.queryExtent();
    return res?.extent ?? null;
  }
  if (typeof target.queryExtent === 'function') {
    const res = await target.queryExtent();
    return res?.extent ?? null;
  }
  return null;
}

export function LayerListPanel() {
  const listRef = useRef<any>(null);
  const legendRef = useRef<any>(null);
  useBindView(listRef);
  useBindView(legendRef);

  const map = useMapStore((s) => s.map);
  const { t } = useI18n();
  const [opacities, setOpacities] = useState<Record<string, number>>({});

  const view = useMapStore((s) => s.view);
  const [notice, setNotice] = useState<string | null>(null);

  // Configura el layer list: casillas de visibilidad y una accion "Zoom a la
  // capa" en cada elemento (capas y subcapas). Sin esto no habia forma de
  // encuadrar la capa de redes desde la interfaz.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.visibilityAppearance = 'checkbox';
    el.listItemCreatedFunction = (event: any) => {
      const item = event.item;
      item.actionsSections = [
        [{ title: t('layers.zoomTo'), icon: 'zoom-to-object', id: 'zoom-to-layer' }],
      ];
    };
  }, [t]);

  // Ejecuta el zoom a la extension de la capa/subcapa pulsada.
  useEffect(() => {
    const el = listRef.current;
    if (!el || !view) return;
    const handler = async (event: any) => {
      if (event.detail?.action?.id !== 'zoom-to-layer') return;
      const target = event.detail.item?.layer;
      if (!target) return;
      setNotice(null);
      try {
        const extent = await resolveExtent(target);
        if (!extent) {
          setNotice(t('layers.noExtent'));
          return;
        }
        await view.goTo(extent);
      } catch {
        setNotice(t('layers.noExtent'));
      }
    };
    el.addEventListener('arcgisTriggerAction', handler);
    return () => el.removeEventListener('arcgisTriggerAction', handler);
  }, [view, t]);

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
      {notice && (
        <CalciteNotice open kind="warning" icon scale="s" closable
          onCalciteNoticeClose={() => setNotice(null)}>
          <div slot="message">{notice}</div>
        </CalciteNotice>
      )}
      <ArcgisLayerList ref={listRef} />

      <CalciteBlock heading={t('layers.opacity')} open collapsible={false}>
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
        {operational.length === 0 && <p className="muted">{t('layers.loading')}</p>}
      </CalciteBlock>

      <CalciteBlock heading={t('layers.legend')} open collapsible>
        <ArcgisLegend ref={legendRef} />
      </CalciteBlock>
    </div>
  );
}
