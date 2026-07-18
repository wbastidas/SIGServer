import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

// El SDK de ArcGIS necesita servir sus "assets" (iconos, workers, locales) de forma
// local para funcionar sin dependencias de CDN externas. Copiamos los assets del
// paquete @arcgis/core dentro del bundle para un despliegue 100% autocontenido en IIS.
// https://developers.arcgis.com/javascript/latest/es-modules/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          // Assets del SDK ArcGIS -> dist/assets/esri/...
          // esriConfig.assetsPath = `${BASE_URL}assets` (ver MapContainer.tsx)
          src: 'node_modules/@arcgis/core/assets/*',
          dest: 'assets',
        },
        {
          // Assets/traducciones (t9n) de Calcite -> dist/assets/<componente>/...
          // Calcite resuelve su ruta base en `${BASE_URL}assets`. Conviven con los
          // assets del SDK (que usan la subcarpeta esri/), sin colisiones.
          src: 'node_modules/@esri/calcite-components/dist/calcite/assets/*',
          dest: 'assets',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2021',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        // Separamos el SDK de ArcGIS en su propio chunk para aprovechar el cache
        // del navegador (RNF-PERF-02).
        manualChunks(id) {
          if (id.includes('@arcgis/core')) return 'arcgis-core';
          if (id.includes('@arcgis/map-components')) return 'arcgis-components';
          if (id.includes('@esri/calcite')) return 'calcite';
          if (id.includes('react')) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
