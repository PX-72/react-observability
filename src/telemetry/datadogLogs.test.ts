import { describe, expect, it, vi } from 'vitest';

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    init: vi.fn(),
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  },
}));

describe('telemetry/datadogLogs', () => {
  it('does not initialize when tokens are missing', async () => {
    vi.stubEnv('VITE_DD_LOGS_CLIENT_TOKEN', '');
    vi.stubEnv('VITE_DD_RUM_CLIENT_TOKEN', '');

    const { initDatadogLogs } = await import('./datadogLogs');
    (window as any).__ddLogsInitialized = undefined;

    initDatadogLogs();
    expect((window as any).__ddLogsInitialized).toBeUndefined();
  });

  it('initializes when logs token exists', async () => {
    vi.stubEnv('VITE_DD_LOGS_CLIENT_TOKEN', 'token');

    const { initDatadogLogs } = await import('./datadogLogs');
    const { datadogLogs } = await import('@datadog/browser-logs');

    (window as any).__ddLogsInitialized = undefined;
    initDatadogLogs();

    expect((datadogLogs as any).init).toHaveBeenCalledTimes(1);
  });

  it('sendLog calls logger method when initialized', async () => {
    const { sendLog } = await import('./datadogLogs');
    const { datadogLogs } = await import('@datadog/browser-logs');

    (window as any).__ddLogsInitialized = true;
    sendLog('info', 'hello', { a: 1 });

    expect((datadogLogs as any).logger.info).toHaveBeenCalledTimes(1);
  });
});


