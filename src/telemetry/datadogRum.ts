import { datadogRum } from '@datadog/browser-rum';

declare global {
  interface Window {
    __ddRumInitialized?: boolean;
  }
}

type RumConfig = {
  applicationId: string;
  clientToken: string;
  site?: string;
  service?: string;
  env?: string;
  version?: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readRumConfig(): RumConfig | null {
  const applicationId = import.meta.env.VITE_DD_RUM_APPLICATION_ID;
  const clientToken = import.meta.env.VITE_DD_RUM_CLIENT_TOKEN;

  if (!applicationId || !clientToken) return null;

  return {
    applicationId,
    clientToken,
    site: import.meta.env.VITE_DD_SITE,
    service: import.meta.env.VITE_DD_SERVICE,
    env: import.meta.env.VITE_DD_ENV,
    version: import.meta.env.VITE_DD_VERSION,
  };
}

export function initDatadogRum(): void {
  if (window.__ddRumInitialized) return;

  const cfg = readRumConfig();
  if (!cfg) return;

  const apiOnThisOrigin = new RegExp(`^${escapeRegex(window.location.origin)}/api/`);

  datadogRum.init({
    applicationId: cfg.applicationId,
    clientToken: cfg.clientToken,
    site: cfg.site ?? 'datadoghq.com',
    service: cfg.service ?? 'react-observability',
    env: cfg.env,
    version: cfg.version,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 0,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    defaultPrivacyLevel: 'mask-user-input',
    allowedTracingUrls: [apiOnThisOrigin],
  });
  window.__ddRumInitialized = true;
}

export function addError(error: unknown, context?: Record<string, unknown>): void {
  if (!window.__ddRumInitialized) return;
  const err = error instanceof Error ? error : new Error(String(error));
  datadogRum.addError(err, context);
}

export function addAction(name: string, context?: Record<string, unknown>): void {
  if (!window.__ddRumInitialized) return;
  datadogRum.addAction(name, context);
}

export function addTiming(name: string, time?: number): void {
  if (!window.__ddRumInitialized) return;
  datadogRum.addTiming(name, time);
}


