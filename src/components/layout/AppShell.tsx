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
import { CoordinateConversion } from '@/components/map/CoordinateConversion';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SearchPanel } from '@/components/panels/SearchPanel';
import { LayerListPanel } from '@/components/panels/LayerListPanel';
import { FilterPanel } from '@/components/panels/FilterPanel';
import { DrawTools } from '@/components/panels/DrawTools';
import { MeasureTools } from '@/components/panels/MeasureTools';
import { PrintPanel } from '@/components/panels/PrintPanel';
import { GoToXYPanel } from '@/components/panels/GoToXYPanel';
import { SelectionTools } from '@/components/panels/SelectionTools';
import { BasemapConfig } from '@/components/panels/BasemapConfig';
import { StreetViewTool } from '@/components/panels/StreetViewTool';
import { TableDock } from '@/components/tables/TableDock';
import { useTableDockStore } from '@/store/useTableDockStore';
import { StreetViewPanel } from '@/components/panels/StreetViewPanel';
import { useMapStore, ActiveTool } from '@/store/useMapStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useUiStore } from '@/store/useUiStore';
import { useI18n } from '@/i18n/useI18n';
import type { LocaleKey } from '@/i18n/strings';
import './shell.css';

interface ToolDef {
  id: Exclude<ActiveTool, null>;
  icon: string;
  toolKey: LocaleKey;
  panelKey: LocaleKey;
}

const TOOLS: ToolDef[] = [
  { id: 'search', icon: 'search', toolKey: 'tool.search', panelKey: 'panel.search' },
  { id: 'layers', icon: 'layers', toolKey: 'tool.layers', panelKey: 'panel.layers' },
  { id: 'basemap', icon: 'basemap', toolKey: 'tool.basemap', panelKey: 'panel.basemap' },
  { id: 'filter', icon: 'filter', toolKey: 'tool.filter', panelKey: 'panel.filter' },
  { id: 'selection', icon: 'select', toolKey: 'tool.selection', panelKey: 'panel.selection' },
  { id: 'draw', icon: 'pencil', toolKey: 'tool.draw', panelKey: 'panel.draw' },
  { id: 'measure', icon: 'measure', toolKey: 'tool.measure', panelKey: 'panel.measure' },
  { id: 'goto', icon: 'coordinate-system', toolKey: 'tool.goto', panelKey: 'panel.goto' },
  { id: 'print', icon: 'print', toolKey: 'tool.print', panelKey: 'panel.print' },
  { id: 'streetview', icon: 'road-sign', toolKey: 'tool.streetView', panelKey: 'panel.streetView' },
];

export function AppShell() {
  const activeTool = useMapStore((s) => s.activeTool);
  const toggleTool = useMapStore((s) => s.toggleTool);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.session?.user);
  const config = useConfigStore((s) => s.config);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const dockOpen = useTableDockStore((s) => s.open);
  const toggleDock = useTableDockStore((s) => s.toggle);
  const { t } = useI18n();
  const [collapsed] = useState(false);

  const activePanelKey = TOOLS.find((tool) => tool.id === activeTool)?.panelKey;

  return (
    <CalciteShell className="app-shell">
      <CalciteNavigation slot="header">
        <CalciteNavigationLogo
          slot="logo"
          heading={config?.app.app.title ?? 'Visor de Redes Electricas'}
          description={config?.app.app.subtitle}
          icon="flash"
        />
        <div slot="content-end" className="nav-user">
          <span className="nav-username">{user?.displayName ?? user?.username}</span>
          <CalciteButton
            appearance="outline-fill"
            kind="neutral"
            scale="s"
            iconStart={theme === 'dark' ? 'brightness' : 'moon'}
            title={theme === 'dark' ? t('app.themeLight') : t('app.themeDark')}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? t('app.themeLight') : t('app.themeDark')}
          </CalciteButton>
          <CalciteButton
            appearance="outline-fill"
            kind="neutral"
            scale="s"
            iconStart="sign-out"
            onClick={logout}
          >
            {t('app.exit')}
          </CalciteButton>
        </div>
      </CalciteNavigation>

      <CalciteShellPanel slot="panel-start" collapsed={collapsed} className="tool-shell-panel">
        <CalciteActionBar slot="action-bar">
          {TOOLS.map((tool) => (
            <CalciteAction
              key={tool.id}
              text={t(tool.toolKey)}
              icon={tool.icon}
              active={activeTool === tool.id || undefined}
              onClick={() => toggleTool(tool.id)}
            />
          ))}
          {/* La tabla no abre un panel lateral: alterna el panel acoplado
              bajo el mapa, que necesita el ancho completo. */}
          <CalciteAction
            text={t('tool.table')}
            icon="table"
            active={dockOpen || undefined}
            onClick={toggleDock}
          />
        </CalciteActionBar>

        {activeTool && (
          <div className="tool-panel-content">
            <div className="tool-panel-header">{activePanelKey ? t(activePanelKey) : ''}</div>
            <div className="tool-panel-body">
              <ErrorBoundary key={activeTool} name={activePanelKey ? t(activePanelKey) : undefined}>
                {activeTool === 'search' && <SearchPanel />}
                {activeTool === 'layers' && <LayerListPanel />}
                {activeTool === 'basemap' && <BasemapConfig />}
                {activeTool === 'filter' && <FilterPanel />}
                {activeTool === 'selection' && <SelectionTools />}
                {activeTool === 'streetview' && <StreetViewTool />}
                {activeTool === 'draw' && <DrawTools />}
                {activeTool === 'measure' && <MeasureTools />}
                {activeTool === 'goto' && <GoToXYPanel />}
                {activeTool === 'print' && <PrintPanel />}
              </ErrorBoundary>
            </div>
          </div>
        )}
      </CalciteShellPanel>

      <div className="map-region">
        <MapContainer />
        <MapControls />
        <CoordinateConversion />
        <ErrorBoundary name={t('panel.table')}>
          <TableDock />
        </ErrorBoundary>
      </div>

      <ErrorBoundary name="Street View">
        <StreetViewPanel />
      </ErrorBoundary>
    </CalciteShell>
  );
}
