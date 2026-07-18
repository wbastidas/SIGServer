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
  { id: 'filter', icon: 'filter', toolKey: 'tool.filter', panelKey: 'panel.filter' },
  { id: 'selection', icon: 'select', toolKey: 'tool.selection', panelKey: 'panel.selection' },
  { id: 'draw', icon: 'pencil', toolKey: 'tool.draw', panelKey: 'panel.draw' },
  { id: 'measure', icon: 'measure', toolKey: 'tool.measure', panelKey: 'panel.measure' },
  { id: 'goto', icon: 'coordinate-system', toolKey: 'tool.goto', panelKey: 'panel.goto' },
  { id: 'print', icon: 'print', toolKey: 'tool.print', panelKey: 'panel.print' },
];

export function AppShell() {
  const activeTool = useMapStore((s) => s.activeTool);
  const toggleTool = useMapStore((s) => s.toggleTool);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.session?.user);
  const config = useConfigStore((s) => s.config);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
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
          icon="lightning-bolt"
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
        </CalciteActionBar>

        {activeTool && (
          <div className="tool-panel-content">
            <div className="tool-panel-header">{activePanelKey ? t(activePanelKey) : ''}</div>
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
        <CoordinateConversion />
      </div>

      <StreetViewPanel />
    </CalciteShell>
  );
}
