/**
 * Panel de busqueda (RF-SRC-01..07). El tipo de busqueda se elige de una lista
 * definida en JSON (RF-SRC-01/06). Soporta busqueda directa y relacionada, con
 * sugerencias opcionales (RF-SRC-07). Al seleccionar un resultado, el mapa hace
 * zoom/pan, resalta el elemento y abre su popup (RF-SRC-05).
 */
import { useMemo, useRef, useState } from 'react';
import {
  CalciteButton,
  CalciteInputText,
  CalciteLabel,
  CalciteNotice,
  CalciteOption,
  CalciteSelect,
} from '@esri/calcite-components-react';
import { useConfigStore } from '@/store/useConfigStore';
import { useMapStore } from '@/store/useMapStore';
import { getSuggestions, runSearch, SearchResult } from '@/services/searchService';
import { highlightAndZoom } from '@/services/highlightService';
import { useI18n } from '@/i18n/useI18n';

export function SearchPanel() {
  const searches = useConfigStore((s) => s.config?.searches ?? []);
  const view = useMapStore((s) => s.view);
  const graphicsLayer = useMapStore((s) => s.graphicsLayer);
  const { t } = useI18n();

  const [selectedId, setSelectedId] = useState(searches[0]?.id ?? '');
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const suggestTimer = useRef<number | undefined>(undefined);

  const activeSearch = useMemo(
    () => searches.find((s) => s.id === selectedId) ?? searches[0],
    [searches, selectedId],
  );

  const suggestionsEnabled =
    activeSearch &&
    (activeSearch.type === 'layer'
      ? activeSearch.suggestions
      : activeSearch.suggestions);

  function onTermInput(value: string) {
    setTerm(value);
    if (!suggestionsEnabled || !activeSearch) return;
    window.clearTimeout(suggestTimer.current);
    suggestTimer.current = window.setTimeout(async () => {
      try {
        setSuggestions(await getSuggestions(activeSearch, value));
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }

  async function handleSearch() {
    if (!activeSearch || !term.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await runSearch(activeSearch, term);
      setResults(res);
      setSearched(true);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(result: SearchResult) {
    if (!view || !graphicsLayer || !result.geometry) return;
    await highlightAndZoom(view, graphicsLayer, result.geometry, {
      zoomScale: result.zoomScale,
      attributes: result.attributes,
      openPopup: true,
      popupTitle: result.popupTitle,
    });
  }

  if (searches.length === 0) {
    return <p className="muted">{t('search.noConfig')}</p>;
  }

  return (
    <div className="panel-section">
      <CalciteLabel>
        {t('search.type')}
        <CalciteSelect
          label={t('search.type')}
          value={selectedId}
          onCalciteSelectChange={(e: any) => {
            setSelectedId(e.target.value);
            setResults([]);
            setSearched(false);
          }}
        >
          {searches.map((s) => (
            <CalciteOption key={s.id} value={s.id}>
              {s.label}
            </CalciteOption>
          ))}
        </CalciteSelect>
      </CalciteLabel>

      <CalciteLabel>
        {t('search.term')}
        <CalciteInputText
          value={term}
          placeholder={t('search.termPlaceholder')}
          onCalciteInputTextInput={(e: any) => onTermInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </CalciteLabel>

      {suggestionsEnabled && suggestions.length > 0 && (
        <ul className="result-list">
          {suggestions.map((s) => (
            <li
              key={s}
              className="result-item"
              role="button"
              tabIndex={0}
              onClick={() => {
                setTerm(s);
                setSuggestions([]);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTerm(s);
                  setSuggestions([]);
                }
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="panel-actions">
        <CalciteButton
          iconStart="search"
          loading={loading || undefined}
          disabled={!term.trim() || undefined}
          onClick={handleSearch}
        >
          {t('tool.search')}
        </CalciteButton>
        <CalciteButton
          appearance="outline"
          kind="neutral"
          onClick={() => {
            setTerm('');
            setResults([]);
            setSearched(false);
            graphicsLayer?.removeAll();
          }}
        >
          {t('common.clear')}
        </CalciteButton>
      </div>

      {error && (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="message">{error}</div>
        </CalciteNotice>
      )}

      {searched && !error && (
        <p className="muted">{t('search.results', { n: results.length })}</p>
      )}

      <ul className="result-list">
        {results.map((r, i) => (
          <li
            key={`${r.label}-${i}`}
            className="result-item"
            onClick={() => handleSelect(r)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(r)}
          >
            {r.label}
            {!r.geometry && <span className="muted"> {t('search.noGeometry')}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
