/**
 * Impresion (RF-PRT-01..04) con el componente arcgis-print, usando el servicio
 * de impresion (ExportWebMap GPServer) del ArcGIS Server, incluyendo simbologia
 * y leyenda. URL del servicio configurable por JSON (RF-PRT-04).
 */
import { useEffect, useRef } from 'react';
import { ArcgisPrint } from '@arcgis/map-components-react';
import { CalciteNotice } from '@esri/calcite-components-react';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { useI18n } from '@/i18n/useI18n';

export function PrintPanel() {
  const printCfg = useConfigStore((s) => s.config?.app.print);
  const view = useMapStore((s) => s.view);
  const { t } = useI18n();
  const printRef = useRef<any>(null);

  useEffect(() => {
    const el = printRef.current;
    if (el && view && printCfg?.printServiceUrl) {
      el.view = view;
      el.printServiceUrl = printCfg.printServiceUrl;
      // Incluir la leyenda de las capas visibles (RF-PRT-03).
      el.includeDefaultTemplates = true;
    }
  }, [view, printCfg]);

  if (!printCfg?.printServiceUrl) {
    return (
      <CalciteNotice open kind="warning" icon scale="s">
        <div slot="message">{t('print.noService')}</div>
      </CalciteNotice>
    );
  }

  return (
    <div className="panel-section">
      <CalciteNotice open icon="print" scale="s">
        <div slot="message">{t('print.help')}</div>
      </CalciteNotice>
      <ArcgisPrint ref={printRef} />
    </div>
  );
}
