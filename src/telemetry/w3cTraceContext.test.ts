import { describe, expect, it, vi } from "vitest";
import { generateTraceparent } from "./w3cTraceContext";

describe("generateTraceparent", () => {
  it("generates version 00 traceparent with valid hex lengths", () => {
    const { traceparent, traceId, parentId, traceFlags } = generateTraceparent();

    expect(traceFlags).toBe("01");
    expect(traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(parentId).toMatch(/^[0-9a-f]{16}$/);
    expect(traceparent).toBe(`00-${traceId}-${parentId}-${traceFlags}`);
  });

  it("never returns all-zero traceId or parentId", () => {
    const zeros32 = "0".repeat(32);
    const zeros16 = "0".repeat(16);

    for (let i = 0; i < 25; i++) {
      const { traceId, parentId } = generateTraceparent();
      expect(traceId).not.toBe(zeros32);
      expect(parentId).not.toBe(zeros16);
    }
  });

  it("retries if crypto returns all zeros", () => {
    const realCrypto = globalThis.crypto;
    const calls: number[] = [];

    vi.stubGlobal("crypto", {
      getRandomValues<T extends ArrayBufferView>(arr: T) {
        calls.push(arr.byteLength);
        const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
        const allZero = calls.length <= 2;
        u8.fill(allZero ? 0 : 1);
        return arr;
      },
    });

    const { traceId, parentId } = generateTraceparent();
    expect(traceId).not.toBe("0".repeat(32));
    expect(parentId).not.toBe("0".repeat(16));

    vi.stubGlobal("crypto", realCrypto);
  });
});


