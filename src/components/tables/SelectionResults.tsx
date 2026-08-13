/**
 * Resultados de la seleccion (RF-SEL-02/03/04/05).
 *
 *  - Agrupa por CAPA, de modo que siempre se sabe que tipo de elemento se ha
 *    escogido.
 *  - Muestra solo las columnas definidas en `selection.fields` del JSON, con la
 *    posibilidad de ampliarlas por capa mediante `selection.fieldsByLayer`.
 *  - Casillas para elegir filas: lo marcado se resalta EN EL MAPA
 *    (sincronizacion tabla -> mapa), y el boton de encuadre lleva a ellos.
 *  - Los valores con dominio se muestran con su descripcion, no con el codigo.
 */
import { useCallback, useEffect, useState } from 'react';
import type Graphic from '@arcgis/core/Graphic';
import { CalciteButton, CalciteCheckbox } from '@esri/calcite-components-react';
import { useMapStore } from '@/store/useMapStore';
import { useConfigStore } from '@/store/useConfigStore';
import {
  highlightAndZoom,
  markSelectedOnMap,
  zoomToGeometries,
} from '@/services/highlightService';
import { featuresToCsv } from '@/services/queryUtils';
import { getDomainMap, describeValue, type DomainMap } from '@/services/domainUtils';
import {
  collectFieldNames,
  fieldsForLayer,
  resolveColumns,
  type ResolvedColumn,
} from '@/services/selectionColumns';
import { useI18n } from '@/i18n/useI18n';

export function SelectionResults() {
  const groups = useMapStore((s) => s.selectionGroups);
  const view = useMapStore((s) => s.view);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const selectionCfg = useConfigStore((s) => s.config?.app.selection);
  const { t } = useI18n();

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [domains, setDomains] = useState<Record<string, DomainMap>>({});

  const keyOf = (gi: number, i: number) => `${gi}:${i}`;

  /** Columnas para una capa: especificas si las hay, si no las generales. */
  const columnsFor = useCallback(
    (layerTitle: string, features: Graphic[]): ResolvedColumn[] =>
      resolveColumns(fieldsForLayer(selectionCfg, layerTitle), collectFieldNames(features)),
    [selectionCfg],
  );

  // Al cambiar la seleccion del mapa se reinician las casillas.
  useEffect(() => {
    setChecked(new Set());
  }, [groups]);

  // Marca en el mapa lo que este marcado en la tabla.
  useEffect(() => {
    if (!graphicsLayer) return;
    const geometries: (__esri.Geometry | null | undefined)[] = [];
    groups.forEach((g, gi) =>
      g.features.forEach((f, i) => {
        if (checked.has(keyOf(gi, i))) geometries.push(f.geometry);
      }),
    );
    if (geometries.length > 0) markSelectedOnMap(graphicsLayer, geometries);
  }, [checked, groups, graphicsLayer]);

  // Carga los dominios de las columnas mostradas para traducir codigos.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, DomainMap> = {};
      for (const group of groups) {
        const layer = group.features[0]?.layer as any;
        if (!layer || typeof layer.load !== 'function') continue;
        for (const col of columnsFor(group.title, group.features)) {
          try {
            const dm = await getDomainMap(layer, col.name);
            if (dm.hasDomain) next[`${group.title}|${col.name}`] = dm;
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
  }, [groups, columnsFor]);

  function toggleRow(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(gi: number, features: Graphic[]) {
    setChecked((prev) => {
      const next = new Set(prev);
      const keys = features.map((_, i) => keyOf(gi, i));
      const allOn = keys.every((k) => next.has(k));
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  async function focusFeature(feature: Graphic) {
    const geometry = feature.geometry;
    if (!view || !graphicsLayer || !geometry) return;
    await highlightAndZoom(view, graphicsLayer, geometry, {
      attributes: feature.attributes,
      openPopup: true,
    });
  }

  async function zoomToChecked() {
    if (!view) return;
    const geometries: (__esri.Geometry | null | undefined)[] = [];
    groups.forEach((g, gi) =>
      g.features.forEach((f, i) => {
        if (checked.has(keyOf(gi, i))) geometries.push(f.geometry);
      }),
    );
    await zoomToGeometries(view, geometries);
  }

  function exportCsv() {
    // Exporta lo marcado; si no hay nada marcado, toda la seleccion.
    const marked = groups.flatMap((g, gi) =>
      g.features.filter((_, i) => checked.has(keyOf(gi, i))),
    );
    const rows = marked.length > 0 ? marked : groups.flatMap((g) => g.features);
    const csv = featuresToCsv(rows);
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
  if (total === 0) return <p className="muted">{t('selection.emptyHint')}</p>;

  return (
    <div>
      <div className="panel-actions" style={{ marginBottom: '0.6rem' }}>
        <CalciteButton
          scale="s"
          iconStart="zoom-to-object"
          disabled={checked.size === 0 || undefined}
          onClick={zoomToChecked}
        >
          {t('selection.zoomChecked', { n: checked.size })}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          scale="s"
          iconStart="download"
          onClick={exportCsv}
        >
          {t('selection.csv')}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          scale="s"
          iconStart="trash"
          onClick={() => {
            setChecked(new Set());
            clearSelection();
            graphicsLayer?.removeAll();
          }}
        >
          {t('common.clear')}
        </CalciteButton>
      </div>

      {groups.map((group, gi) => {
        const columns = columnsFor(group.title, group.features);
        const allOn =
          group.features.length > 0 &&
          group.features.every((_, i) => checked.has(keyOf(gi, i)));
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
                  <th className="check-col">
                    <CalciteCheckbox
                      checked={allOn || undefined}
                      title={t('selection.checkAll')}
                      onCalciteCheckboxChange={() => toggleGroup(gi, group.features)}
                    />
                  </th>
                  {columns.map((c) => (
                    <th key={c.name}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.features.map((f, i) => {
                  const key = keyOf(gi, i);
                  const isChecked = checked.has(key);
                  return (
                    <tr key={key} className={isChecked ? 'is-active' : undefined}>
                      <td
                        className="check-col"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(key);
                        }}
                      >
                        <CalciteCheckbox checked={isChecked || undefined} />
                      </td>
                      {columns.map((c) => {
                        const domain = domains[`${group.title}|${c.name}`];
                        const raw = f.attributes?.[c.name];
                        return (
                          <td
                            key={c.name}
                            title={t('selection.goTo')}
                            onClick={() => focusFeature(f)}
                          >
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
