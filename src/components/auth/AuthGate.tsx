/**
 * Guard de ruta (RF-AUTH-02): no renderiza el visor hasta autenticar.
 * Envuelve el arbol protegido.
 */
import { PropsWithChildren } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginPage } from './LoginPage';

export function AuthGate({ children }: PropsWithChildren) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return <>{children}</>;
}
