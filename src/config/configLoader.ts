/**
 * Carga la configuracion externa desde /config/*.json en tiempo de ejecucion
 * (RNF-CFG-01, RNF-CFG-03). No se importa JSON en el bundle: se hace fetch para
 * permitir recarga sin recompilar. La respuesta se pide con cache: 'no-store'.
 */
import type {
  AppConfig,
  FullConfig,
  PopupsConfig,
  SearchesConfig,
} from '@/types/config';

const CONFIG_BASE = `${import.meta.env.BASE_URL}config`;

async function fetchJson<T>(file: string): Promise<T> {
  const url = `${CONFIG_BASE}/${file}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`No se pudo cargar la configuracion ${file} (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

export async function loadFullConfig(): Promise<FullConfig> {
  const [app, searches, popups] = await Promise.all([
    fetchJson<AppConfig>('app-config.json'),
    fetchJson<SearchesConfig>('searches.json'),
    fetchJson<PopupsConfig>('popups.json'),
  ]);

  validateAppConfig(app);

  return {
    app,
    searches: searches.searches ?? [],
    popups: popups.popups ?? [],
  };
}

function validateAppConfig(app: AppConfig): void {
  if (!app.map?.basemapUrl) {
    throw new Error('app-config.json: falta map.basemapUrl');
  }
  if (!app.map?.operationalServiceUrl) {
    throw new Error('app-config.json: falta map.operationalServiceUrl');
  }
  if (!app.map?.spatialReferenceWkid) {
    throw new Error('app-config.json: falta map.spatialReferenceWkid');
  }
}
