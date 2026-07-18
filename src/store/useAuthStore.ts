/** Store de sesion/autenticacion (RF-AUTH-02/03). */
import { create } from 'zustand';
import type { Session } from '@/types/auth';
import { login as doLogin, logout as doLogout, restoreSession } from '@/services/authService';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: () => boolean;
  init: () => void;
  login: (
    username: string,
    password: string,
    opts: { apiBaseUrl?: string; tokenExpirationMinutes: number },
  ) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: false,
  error: null,
  isAuthenticated: () => {
    const s = get().session;
    return !!s && s.expiresAt > Date.now();
  },
  init: () => {
    const session = restoreSession();
    if (session) set({ session });
  },
  login: async (username, password, opts) => {
    set({ loading: true, error: null });
    const result = await doLogin(username, password, opts);
    if (result.ok && result.session) {
      set({ session: result.session, loading: false });
      return true;
    }
    set({ error: result.error ?? 'Error desconocido', loading: false });
    return false;
  },
  logout: () => {
    doLogout();
    set({ session: null });
  },
}));
