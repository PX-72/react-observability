function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function isAllZeroHex(hex: string): boolean {
  return /^[0]+$/.test(hex);
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export type Traceparent = {
  traceparent: string;
  traceId: string;
  parentId: string;
  traceFlags: string;
};

export function generateTraceparent(): Traceparent {
  let traceId = randomHex(16);
  while (isAllZeroHex(traceId)) traceId = randomHex(16);

  let parentId = randomHex(8);
  while (isAllZeroHex(parentId)) parentId = randomHex(8);

  const version = "00";
  const traceFlags = "01";
  const traceparent = `${version}-${traceId}-${parentId}-${traceFlags}`;

  return { traceparent, traceId, parentId, traceFlags };
}


