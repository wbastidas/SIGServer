/**
 * Resultados de la seleccion (RF-SEL-02/03/05).
 *
 * Mejoras respecto a la version anterior:
 *  - Agrupa por CAPA, de modo que siempre se sabe que tipo de elemento se ha
 *    escogido (antes la tabla mostraba filas sueltas sin contexto).
 *  - Muestra solo las columnas definidas en `selection.fields` del JSON
 *    (por defecto OBJECTID y el codigo de estructura), no todos los atributos.
 *  - Los valores con dominio se muestran con su descripcion, no con el codigo.
 */
import { useEffect, useMemo, useState } from 'react';
import type Graphic from '@arcgis/core/Graphic';
import { CalciteButton } from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useConfigStore } from '@/store/useConfigStore';
import { highlightAndZoom } from '@/services/highlightService';
import { featuresToCsv } from '@/services/queryUtils';
import { getDomainMap, describeValue, type DomainMap } from '@/services/domainUtils';
import { useI18n } from '@/i18n/useI18n';

/** Resuelve que columnas mostrar para un conjunto de elementos. */
function resolveColumns(
  configured: { name: string; label?: string }[],
  features: Graphic[],
): { name: string; label: string }[] {
  const available = new Set<string>();
  features.forEach((f) => Object.keys(f.attributes ?? {}).forEach((k) => available.add(k)));

  // Coincidencia sin distinguir mayusculas: los servicios varian el case.
  const resolved: { name: string; label: string }[] = [];
  for (const col of configured) {
    const real = Array.from(available).find(
      (a) => a.toLowerCase() === col.name.toLowerCase(),
    );
    if (real) resolved.push({ name: real, label: col.label ?? real });
  }
  // Si ninguna columna configurada existe en esta capa, se usan las primeras.
  if (resolved.length === 0) {
    return Array.from(available)
      .slice(0, 4)
      .map((name) => ({ name, label: name }));
  }
  return resolved;
}

export function SelectionResults() {
  const groups = useMapStore((s) => s.selectionGroups);
  const view = useMapStore((s) => s.view);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const selectionCfg = useConfigStore((s) => s.config?.app.selection);
  const { t } = useI18n();

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [domains, setDomains] = useState<Record<string, DomainMap>>({});

  const configuredFields = useMemo(
    () => selectionCfg?.fields ?? [{ name: 'OBJECTID' }],
    [selectionCfg],
  );

  // Carga los dominios de las columnas mostradas para traducir codigos.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, DomainMap> = {};
      for (const group of groups) {
        const layer = group.features[0]?.layer as any;
        if (!layer || typeof layer.load !== 'function') continue;
        const cols = resolveColumns(configuredFields, group.features);
        for (const col of cols) {
          const key = `${group.title}|${col.name}`;
          try {
            const dm = await getDomainMap(layer, col.name);
            if (dm.hasDomain) next[key] = dm;
          } catch {
            /* sin dominio */
          }
        }
      }
      if (!cancelled && Object.keys(next).length > 0) setDomains(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [groups, configuredFields]);

  async function focusFeature(feature: Graphic, key: string) {
    const geometry = feature.geometry;
    if (!view || !graphicsLayer || !geometry) return;
    setActiveKey(key);
    await highlightAndZoom(view, graphicsLayer, geometry, {
      attributes: feature.attributes,
      openPopup: true,
    });
  }

  function exportCsv() {
    const csv = featuresToCsv(groups.flatMap((g) => g.features));
    if (!csv) return;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seleccion_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = groups.reduce((n, g) => n + g.features.length, 0);

  if (total === 0) {
    return <p className="muted">{t('selection.emptyHint')}</p>;
  }

  return (
    <div>
      <div className="panel-actions" style={{ marginBottom: '0.6rem' }}>
        <CalciteButton appearance="outline" kind="neutral" scale="s" iconStart="download" onClick={exportCsv}>
          {t('selection.csv')}
        </CalciteButton>
        <CalciteButton appearance="outline" kind="neutral" scale="s" iconStart="trash" onClick={clearSelection}>
          {t('common.clear')}
        </CalciteButton>
      </div>

      {groups.map((group, gi) => {
        const columns = resolveColumns(configuredFields, group.features);
        return (
          <div className="selection-group" key={`${group.title}-${gi}`}>
            {selectionCfg?.showLayerName !== false && group.title && (
              <h4 className="selection-group-title">
                {group.title}
                <span className="count">({group.features.length})</span>
              </h4>
            )}
            <table className="dock-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.name}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.features.map((f, i) => {
                  const key = `${gi}-${i}`;
                  return (
                    <tr
                      key={key}
                      className={activeKey === key ? 'is-active' : undefined}
                      title={t('selection.goTo')}
                      onClick={() => focusFeature(f, key)}
                    >
                      {columns.map((c) => {
                        const domain = domains[`${group.title}|${c.name}`];
                        const raw = f.attributes?.[c.name];
                        return (
                          <td key={c.name}>
                            {domain ? describeValue(domain, raw) : String(raw ?? '')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
