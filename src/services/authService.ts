/**
 * Servicio de autenticacion (RF-AUTH).
 *
 * Estrategia doble:
 *  - Si hay backend (auth.apiBaseUrl o VITE_AUTH_API_URL): delega en POST /login
 *    y recibe un JWT real firmado en servidor con contrasenas hasheadas (RNF-SEC-01,
 *    fase 1 de la seccion 8). El frontend NO valida contrasenas.
 *  - Modo demo (sin backend): valida admin/admin SOLO para arranque (RF-AUTH-01).
 *    Genera un pseudo-token local. Esto NO es seguridad real y esta claramente
 *    marcado. La arquitectura permite sustituir el proveedor sin tocar la UI
 *    (RF-AUTH-04).
 */
import type { LoginResult, Session } from '@/types/auth';

const STORAGE_KEY = 'sig.session';

interface LoginOptions {
  apiBaseUrl?: string;
  tokenExpirationMinutes: number;
}

export async function login(
  username: string,
  password: string,
  opts: LoginOptions,
): Promise<LoginResult> {
  const apiBaseUrl = opts.apiBaseUrl || import.meta.env.VITE_AUTH_API_URL || '';

  if (apiBaseUrl) {
    return loginViaBackend(apiBaseUrl, username, password);
  }
  return loginDemo(username, password, opts.tokenExpirationMinutes);
}

async function loginViaBackend(
  apiBaseUrl: string,
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const msg = res.status === 401 ? 'Credenciales invalidas' : `Error de autenticacion (${res.status})`;
      return { ok: false, error: msg };
    }
    const data = (await res.json()) as { token: string; expiresAt: number; user: Session['user'] };
    const session: Session = { token: data.token, expiresAt: data.expiresAt, user: data.user };
    persist(session);
    return { ok: true, session };
  } catch {
    return { ok: false, error: 'No se pudo contactar el servicio de autenticacion' };
  }
}

// ---- Modo demo (fase 0, arranque) -----------------------------------------
function loginDemo(username: string, password: string, expMinutes: number): LoginResult {
  const DEMO_USER = 'admin';
  const DEMO_PASS = 'admin';
  if (username !== DEMO_USER || password !== DEMO_PASS) {
    return { ok: false, error: 'Credenciales invalidas (demo: admin / admin)' };
  }
  const expiresAt = Date.now() + expMinutes * 60_000;
  const session: Session = {
    user: { username, roles: ['admin'], displayName: 'Administrador (demo)' },
    // Pseudo-token local: NO es un JWT verificable. Solo para el arranque sin backend.
    token: btoa(`${username}:${expiresAt}`),
    expiresAt,
  };
  persist(session);
  return { ok: true, session };
}

function persist(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function restoreSession(): Session | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (session.expiresAt <= Date.now()) {
      logout();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
