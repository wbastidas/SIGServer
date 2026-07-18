/**
 * Estructura principal de la app (RNF-UX-01/02). Compone el mapa, la barra de
 * accion con las herramientas (modulares y desacopladas, RF-ARQ-01), el panel
 * lateral y los controles del mapa (zoom, locate). Responsiva.
 */
import { useState } from 'react';
import {
  CalciteShell,
  CalciteShellPanel,
  CalciteActionBar,
  CalciteAction,
  CalciteNavigation,
  CalciteNavigationLogo,
  CalciteButton,
} from '@esri/calcite-components-react';
import { MapContainer } from '@/components/map/MapContainer';
import { MapControls } from '@/components/map/MapControls';
import { SearchPanel } from '@/components/panels/SearchPanel';
import { LayerListPanel } from '@/components/panels/LayerListPanel';
import { FilterPanel } from '@/components/panels/FilterPanel';
import { DrawTools } from '@/components/panels/DrawTools';
import { MeasureTools } from '@/components/panels/MeasureTools';
import { PrintPanel } from '@/components/panels/PrintPanel';
import { GoToXYPanel } from '@/components/panels/GoToXYPanel';
import { SelectionTable } from '@/components/panels/SelectionTable';
import { StreetViewPanel } from '@/components/panels/StreetViewPanel';
import { useMapStore, ActiveTool } from '@/store/useMapStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';
import './shell.css';

interface ToolDef {
  id: Exclude<ActiveTool, null>;
  icon: string;
  label: string;
}

const TOOLS: ToolDef[] = [
  { id: 'search', icon: 'search', label: 'Buscar' },
  { id: 'layers', icon: 'layers', label: 'Capas y leyenda' },
  { id: 'filter', icon: 'filter', label: 'Filtros' },
  { id: 'selection', icon: 'select', label: 'Seleccion / Tabla' },
  { id: 'draw', icon: 'pencil', label: 'Dibujo' },
  { id: 'measure', icon: 'measure', label: 'Medicion' },
  { id: 'goto', icon: 'coordinate-system', label: 'Ir a XY / LatLong' },
  { id: 'print', icon: 'print', label: 'Imprimir' },
];

const PANEL_TITLES: Record<string, string> = {
  search: 'Busqueda',
  layers: 'Capas y leyenda',
  filter: 'Filtros',
  selection: 'Seleccion y tabla',
  draw: 'Dibujo',
  measure: 'Medicion',
  goto: 'Ir a una ubicacion',
  print: 'Impresion',
};

export function AppShell() {
  const activeTool = useMapStore((s) => s.activeTool);
  const toggleTool = useMapStore((s) => s.toggleTool);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.session?.user);
  const config = useConfigStore((s) => s.config);
  const [collapsed] = useState(false);

  return (
    <CalciteShell className="app-shell">
      <CalciteNavigation slot="header">
        <CalciteNavigationLogo
          slot="logo"
          heading={config?.app.app.title ?? 'Visor de Redes Electricas'}
          description={config?.app.app.subtitle}
          icon="lightning-bolt"
        />
        <div slot="content-end" className="nav-user">
          <span className="nav-username">{user?.displayName ?? user?.username}</span>
          <CalciteButton
            appearance="outline-fill"
            kind="neutral"
            scale="s"
            iconStart="sign-out"
            onClick={logout}
          >
            Salir
          </CalciteButton>
        </div>
      </CalciteNavigation>

      <CalciteShellPanel slot="panel-start" collapsed={collapsed} className="tool-shell-panel">
        <CalciteActionBar slot="action-bar">
          {TOOLS.map((t) => (
            <CalciteAction
              key={t.id}
              text={t.label}
              icon={t.icon}
              active={activeTool === t.id || undefined}
              onClick={() => toggleTool(t.id)}
            />
          ))}
        </CalciteActionBar>

        {activeTool && (
          <div className="tool-panel-content">
            <div className="tool-panel-header">{PANEL_TITLES[activeTool]}</div>
            <div className="tool-panel-body">
              {activeTool === 'search' && <SearchPanel />}
              {activeTool === 'layers' && <LayerListPanel />}
              {activeTool === 'filter' && <FilterPanel />}
              {activeTool === 'selection' && <SelectionTable />}
              {activeTool === 'draw' && <DrawTools />}
              {activeTool === 'measure' && <MeasureTools />}
              {activeTool === 'goto' && <GoToXYPanel />}
              {activeTool === 'print' && <PrintPanel />}
            </div>
          </div>
        )}
      </CalciteShellPanel>

      <div className="map-region">
        <MapContainer />
        <MapControls />
      </div>

      <StreetViewPanel />
    </CalciteShell>
  );
}
