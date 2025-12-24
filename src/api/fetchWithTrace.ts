import { generateTraceparent } from '../telemetry/w3cTraceContext';

export type FetchWithTraceResult<T> = {
  traceparent: string;
  response: Response;
  data: T;
};

export type FetchWithTraceOptions = {
  traceparent?: string;
  onTraceparent?: (traceparent: string) => void;
};

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return await response.json();
  return await response.text();
}

export async function fetchWithTrace<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchWithTraceOptions = {},
): Promise<FetchWithTraceResult<T>> {
  const traceparent = options.traceparent ?? generateTraceparent().traceparent;
  options.onTraceparent?.(traceparent);

  const headers = new Headers(init.headers);
  headers.set('traceparent', traceparent);

  const response = await fetch(input, { ...init, headers });
  const data = (await readResponseBody(response)) as T;

  return { traceparent, response, data };
}


