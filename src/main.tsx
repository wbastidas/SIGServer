/**
 * Punto de entrada. Registra Calcite Design System y los componentes web del
 * SDK de ArcGIS (patron recomendado 5.x: componentes, no widgets). Los assets
 * se sirven localmente (sin CDN) para un despliegue autocontenido en IIS.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

// --- Calcite Design System ---
import '@esri/calcite-components/dist/calcite/calcite.css';
import { setAssetPath as setCalciteAssetPath } from '@esri/calcite-components/dist/components';
import { defineCustomElements as defineCalcite } from '@esri/calcite-components/dist/loader';

// --- Componentes web del SDK de ArcGIS ---
import { defineCustomElements as defineMapComponents } from '@arcgis/map-components/dist/loader';

import { App } from './App';
import './styles/index.css';

// Assets/traducciones de Calcite servidos desde /assets (ver vite.config.ts).
setCalciteAssetPath(`${import.meta.env.BASE_URL}assets`);

// Registro de custom elements.
defineCalcite(window);
defineMapComponents(window);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
