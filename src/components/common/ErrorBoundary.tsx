/**
 * Limite de error (ErrorBoundary) que aisla el fallo de un modulo/herramienta
 * para que no derribe toda la aplicacion (RF-ARQ-01: modulos desacoplados y
 * robustos). Muestra un aviso Calcite con opcion de reintentar.
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { CalciteButton, CalciteNotice } from '@esri/calcite-components-react';
import { useConfigStore } from '@/store/useConfigStore';
import { DEFAULT_LOCALE, translate } from '@/i18n/strings';

/**
 * Traduccion fuera de React: este es un componente de clase (los limites de
 * error deben serlo) y no puede usar el hook `useI18n`.
 */
function t(
  key: Parameters<typeof translate>[1],
  params?: Parameters<typeof translate>[2],
): string {
  const locale =
    useConfigStore.getState().config?.app.app.defaultLocale ?? DEFAULT_LOCALE;
  return translate(locale, key, params);
}

interface Props {
  /** Nombre del modulo, para el mensaje. */
  name?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Registro para diagnostico; en produccion podria enviarse a un servicio.
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info);
  }

  private reset = () => this.setState({ hasError: false, message: '' });

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <CalciteNotice open kind="danger" icon scale="s">
          <div slot="title">
            {this.props.name
              ? t('error.inModule', { name: this.props.name })
              : t('error.generic')}
          </div>
          <div slot="message">{this.state.message || t('error.unexpected')}</div>
          <CalciteButton slot="link" appearance="transparent" scale="s" onClick={this.reset}>
            {t('common.retry')}
          </CalciteButton>
        </CalciteNotice>
      );
    }
    return this.props.children;
  }
}
