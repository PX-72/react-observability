import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./datadogLogs', () => ({
  initDatadogLogs: vi.fn(),
  sendLog: vi.fn(),
}));

describe('telemetry/logs', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { initLogs } = await import('./logs');
    initLogs({ remoteLogLevel: 'info', localOnly: false });
  });

  it('logs locally by default, but remote debug is filtered by default remoteLogLevel=info', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const { debug } = await import('./logs');
    const dd = await import('./datadogLogs');

    debug('hello', 1);

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect((dd as any).sendLog).toHaveBeenCalledTimes(0);

    debugSpy.mockRestore();
  });

  it('sends remote logs at/above remoteLogLevel', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { info } = await import('./logs');
    const dd = await import('./datadogLogs');

    info('hello', 1);

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect((dd as any).sendLog).toHaveBeenCalledTimes(1);

    infoSpy.mockRestore();
  });

  it('can be configured to local-only', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { initLogs, info } = await import('./logs');
    const dd = await import('./datadogLogs');

    initLogs({ localOnly: true });
    info('only local');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect((dd as any).sendLog).toHaveBeenCalledTimes(0);

    infoSpy.mockRestore();
  });

  it('remoteLogLevel only affects remote emission (local always logs)', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { initLogs, debug, info } = await import('./logs');
    const dd = await import('./datadogLogs');

    initLogs({ remoteLogLevel: 'warn', localOnly: false });
    debug('nope');
    info('nope');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect((dd as any).sendLog).toHaveBeenCalledTimes(0);

    debugSpy.mockRestore();
    infoSpy.mockRestore();
  });
});


