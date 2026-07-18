/** Tipos de autenticacion (RF-AUTH). */

export interface AuthUser {
  username: string;
  roles: string[];
  displayName?: string;
}

export interface Session {
  user: AuthUser;
  token: string;
  /** Epoch ms de expiracion del token de la app. */
  expiresAt: number;
}

export interface LoginResult {
  ok: boolean;
  session?: Session;
  error?: string;
}
