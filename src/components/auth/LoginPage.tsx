/** Pantalla de login (RF-AUTH-01). UI Calcite. */
import { FormEvent, useState } from 'react';
import {
  CalciteButton,
  CalciteCard,
  CalciteInput,
  CalciteLabel,
  CalciteNotice,
} from '@esri/calcite-components-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useI18n } from '@/i18n/useI18n';
import './login.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const config = useConfigStore((s) => s.config);
  const { t } = useI18n();

  const appTitle = config?.app.app.title ?? 'Visor de Redes Electricas';
  const subtitle = config?.app.app.subtitle ?? '';
  const authCfg = config?.app.auth;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await login(username, password, {
      apiBaseUrl: authCfg?.apiBaseUrl,
      tokenExpirationMinutes: authCfg?.tokenExpirationMinutes ?? 60,
    });
  }

  return (
    <div className="login-wrapper">
      <CalciteCard className="login-card">
        <div slot="heading" className="login-title">{appTitle}</div>
        <div slot="subtitle" className="login-subtitle">{subtitle}</div>

        <form onSubmit={handleSubmit} className="login-form">
          <CalciteLabel>
            {t('login.user')}
            <CalciteInput
              value={username}
              type="text"
              placeholder="admin"
              autocomplete="username"
              onCalciteInputInput={(e: any) => setUsername(e.target.value)}
            />
          </CalciteLabel>

          <CalciteLabel>
            {t('login.password')}
            <CalciteInput
              value={password}
              type="password"
              placeholder="admin"
              autocomplete="current-password"
              onCalciteInputInput={(e: any) => setPassword(e.target.value)}
            />
          </CalciteLabel>

          {error && (
            <CalciteNotice open kind="danger" icon scale="s">
              <div slot="message">{error}</div>
            </CalciteNotice>
          )}

          <CalciteButton
            type="submit"
            width="full"
            loading={loading || undefined}
            disabled={(!username || !password) || undefined}
          >
            {t('login.submit')}
          </CalciteButton>

          {!authCfg?.apiBaseUrl && !import.meta.env.VITE_AUTH_API_URL && (
            <p className="login-hint">{t('login.demoHint')}</p>
          )}
        </form>
      </CalciteCard>
    </div>
  );
}
