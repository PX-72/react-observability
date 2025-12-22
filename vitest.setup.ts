import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { vi } from "vitest";

afterEach(() => {
  cleanup();
});

if (!globalThis.crypto?.getRandomValues) {
  vi.stubGlobal("crypto", {
    getRandomValues<T extends ArrayBufferView>(arr: T) {
      const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      for (let i = 0; i < u8.length; i++) u8[i] = (Math.random() * 256) | 0;
      return arr;
    },
  });
}


