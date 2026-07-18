import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Configuracion de pruebas unitarias. Entorno node: probamos logica pura sin el
// SDK de ArcGIS ni el DOM (RNF-CFG-02: codigo modular y verificable).
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
