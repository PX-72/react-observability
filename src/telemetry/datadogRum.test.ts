import { describe, expect, it, vi } from 'vitest';

vi.mock('@datadog/browser-rum', () => ({
  datadogRum: {
    init: vi.fn(),
    addError: vi.fn(),
    addAction: vi.fn(),
    addTiming: vi.fn(),
  },
}));

describe('telemetry/datadogRum', () => {
  it('does not initialize when env vars are missing', async () => {
    vi.stubEnv('VITE_DD_RUM_APPLICATION_ID', '');
    vi.stubEnv('VITE_DD_RUM_CLIENT_TOKEN', '');

    const { initDatadogRum } = await import('./datadogRum');
    (window as any).__ddRumInitialized = undefined;

    initDatadogRum();
    expect((window as any).__ddRumInitialized).toBeUndefined();
  });

  it('guards against double initialization', async () => {
    vi.stubEnv('VITE_DD_RUM_APPLICATION_ID', 'app');
    vi.stubEnv('VITE_DD_RUM_CLIENT_TOKEN', 'token');

    const { initDatadogRum } = await import('./datadogRum');
    const { datadogRum } = await import('@datadog/browser-rum');

    (window as any).__ddRumInitialized = undefined;
    initDatadogRum();
    initDatadogRum();

    expect((datadogRum as any).init).toHaveBeenCalledTimes(1);
  });

  it('addError sends to datadogRum when initialized', async () => {
    const { addError } = await import('./datadogRum');
    const { datadogRum } = await import('@datadog/browser-rum');

    (window as any).__ddRumInitialized = true;
    addError(new Error('boom'), { source: 'test' });

    expect((datadogRum as any).addError).toHaveBeenCalledTimes(1);
  });

  it('addAction and addTiming are no-ops until initialized', async () => {
    const { addAction, addTiming } = await import('./datadogRum');
    const { datadogRum } = await import('@datadog/browser-rum');

    (window as any).__ddRumInitialized = undefined;
    addAction('x', { a: 1 });
    addTiming('t');

    expect((datadogRum as any).addAction).toHaveBeenCalledTimes(0);
    expect((datadogRum as any).addTiming).toHaveBeenCalledTimes(0);
  });
});


