import { datadogLogs } from '@datadog/browser-logs';
import type { LogLevel } from './logLevels';

declare global {
  interface Window {
    __ddLogsInitialized?: boolean;
  }
}

type LogsConfig = {
  clientToken: string;
  site?: string;
  service?: string;
  env?: string;
  version?: string;
};

function readLogsConfig(): LogsConfig | null {
  // Prefer a dedicated logs token, but allow reusing the RUM token for the demo app.
  const clientToken =
    import.meta.env.VITE_DD_LOGS_CLIENT_TOKEN ?? import.meta.env.VITE_DD_RUM_CLIENT_TOKEN;

  if (!clientToken) return null;

  return {
    clientToken,
    site: import.meta.env.VITE_DD_SITE,
    service: import.meta.env.VITE_DD_SERVICE,
    env: import.meta.env.VITE_DD_ENV,
    version: import.meta.env.VITE_DD_VERSION,
  };
}

export function initDatadogLogs(): void {
  if (window.__ddLogsInitialized) return;

  const cfg = readLogsConfig();
  if (!cfg) return;

  datadogLogs.init({
    clientToken: cfg.clientToken,
    site: cfg.site ?? 'datadoghq.com',
    service: cfg.service ?? 'react-observability',
    env: cfg.env,
    version: cfg.version,
    forwardErrorsToLogs: false,
  });

  window.__ddLogsInitialized = true;
}

export function sendLog(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (!window.__ddLogsInitialized) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logger = datadogLogs.logger as any;
  logger[level](message, context);
}


