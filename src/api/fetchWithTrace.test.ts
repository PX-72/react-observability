import { describe, expect, it, vi } from 'vitest';
import { fetchWithTrace } from './fetchWithTrace';

describe('fetchWithTrace', () => {
  it('injects traceparent header and returns it', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01';
    const onTraceparent = vi.fn();
    const result = await fetchWithTrace('/api/requests', { method: 'POST' }, { traceparent, onTraceparent });

    expect(result.traceparent).toBe(traceparent);
    expect(onTraceparent).toHaveBeenCalledWith(traceparent);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get('traceparent')).toBe(traceparent);
  });

  it('parses text response when not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 418, headers: { 'content-type': 'text/plain' } }),
    );

    const { data, response } = await fetchWithTrace('/api/requests', {}, {
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
    });

    expect(response.status).toBe(418);
    expect(data).toBe('nope');
  });
});


