/**
 * Componente raiz. Orquesta: carga de configuracion externa, restauracion de
 * sesion, guard de autenticacion (RF-AUTH-02), tema Calcite (claro/oscuro) e
 * inicializacion del token de ArcGIS si los servicios estan securizados (RF-AUTH-05).
 */
import { useEffect } from 'react';
import { CalciteLoader, CalciteNotice } from '@esri/calcite-components-react';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/layout/AppShell';
import { useConfigStore } from '@/store/useConfigStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { initArcgisToken } from '@/services/arcgisTokenService';

export function App() {
  const { config, loading, error, load } = useConfigStore();
  const initAuth = useAuthStore((s) => s.init);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  // Carga inicial de configuracion + restauracion de sesion.
  useEffect(() => {
    load();
    initAuth();
  }, [load, initAuth]);

  // Semilla del tema desde la config la primera vez (si el usuario no ha elegido).
  useEffect(() => {
    if (config && !localStorage.getItem('sig.theme')) {
      setTheme(config.app.app.defaultTheme ?? 'light');
    }
    document.documentElement.lang = config?.app.app.defaultLocale ?? 'es-EC';
  }, [config, setTheme]);

  // Aplica el tema claro/oscuro a Calcite y a los componentes del SDK (RNF-UX-01).
  useEffect(() => {
    document.body.classList.toggle('calcite-mode-dark', theme === 'dark');
    document.body.classList.toggle('calcite-mode-light', theme === 'light');
  }, [theme]);

  // Token de ArcGIS Server (solo si los servicios estan securizados y hay backend).
  useEffect(() => {
    if (!config || !isAuthenticated) return;
    const { arcgisServerSecured, apiBaseUrl } = config.app.auth;
    if (arcgisServerSecured && apiBaseUrl) {
      initArcgisToken(apiBaseUrl);
    }
  }, [config, isAuthenticated]);

  if (loading && !config) {
    return <CalciteLoader label="Cargando configuracion..." text="Cargando visor..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: 560, margin: '3rem auto' }}>
        <CalciteNotice open kind="danger" icon>
          <div slot="title">No se pudo iniciar el visor</div>
          <div slot="message">{error}</div>
        </CalciteNotice>
      </div>
    );
  }

  if (!config) return null;

  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}
