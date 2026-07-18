/**
 * Gestion transparente del token de ArcGIS Server cuando los servicios estan
 * securizados (RF-AUTH-05, RNF-SEC-03).
 *
 * Diseno: el token NUNCA debe generarse en el navegador con credenciales del
 * servidor. Este modulo pide el token a nuestro backend (token broker), que
 * guarda las credenciales del ArcGIS y devuelve un token de corta vida. Luego
 * se registra en IdentityManager del SDK para que todas las peticiones a los
 * servicios lo incluyan automaticamente.
 */
import esriId from '@arcgis/core/identity/IdentityManager';

interface BrokerToken {
  token: string;
  expires: number; // epoch ms
  server: string; // URL base del ArcGIS Server (…/arcgis/rest)
}

let refreshTimer: number | undefined;

/**
 * Registra un token para el ArcGIS Server via backend broker.
 * @param apiBaseUrl base del backend (ej. /sig-api). Si vacio, no hace nada.
 */
export async function initArcgisToken(apiBaseUrl: string): Promise<void> {
  if (!apiBaseUrl) return;
  const info = await fetchToken(apiBaseUrl);
  if (!info) return;
  registerToken(info);
  scheduleRefresh(apiBaseUrl, info.expires);
}

async function fetchToken(apiBaseUrl: string): Promise<BrokerToken | null> {
  try {
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/arcgis-token`, {
      headers: sessionAuthHeader(),
    });
    if (!res.ok) return null;
    return (await res.json()) as BrokerToken;
  } catch {
    return null;
  }
}

function registerToken(info: BrokerToken): void {
  esriId.registerToken({
    server: info.server,
    token: info.token,
    expires: info.expires,
  });
}

function scheduleRefresh(apiBaseUrl: string, expires: number): void {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  // Renovar 1 minuto antes de expirar.
  const delay = Math.max(30_000, expires - Date.now() - 60_000);
  refreshTimer = window.setTimeout(async () => {
    const info = await fetchToken(apiBaseUrl);
    if (info) {
      registerToken(info);
      scheduleRefresh(apiBaseUrl, info.expires);
    }
  }, delay);
}

function sessionAuthHeader(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem('sig.session');
    if (!raw) return {};
    const { token } = JSON.parse(raw) as { token: string };
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
