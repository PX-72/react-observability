import { describe, expect, it, vi } from "vitest";

vi.mock("@datadog/browser-rum", () => ({
  datadogRum: {
    init: vi.fn(),
    addError: vi.fn(),
  },
}));

describe("telemetry/datadog", () => {
  it("does not initialize when env vars are missing", async () => {
    vi.stubEnv("VITE_DD_RUM_APPLICATION_ID", "");
    vi.stubEnv("VITE_DD_RUM_CLIENT_TOKEN", "");

    const { initDatadogRum } = await import("./datadog");
    (window as any).__ddRumInitialized = undefined;

    initDatadogRum();
    expect((window as any).__ddRumInitialized).toBeUndefined();
  });

  it("guards against double initialization", async () => {
    vi.stubEnv("VITE_DD_RUM_APPLICATION_ID", "app");
    vi.stubEnv("VITE_DD_RUM_CLIENT_TOKEN", "token");

    const { initDatadogRum } = await import("./datadog");
    const { datadogRum } = await import("@datadog/browser-rum");

    (window as any).__ddRumInitialized = undefined;
    initDatadogRum();
    initDatadogRum();

    expect((datadogRum as any).init).toHaveBeenCalledTimes(1);
  });

  it("reportError sends to datadogRum when initialized", async () => {
    const { reportError } = await import("./datadog");
    const { datadogRum } = await import("@datadog/browser-rum");

    (window as any).__ddRumInitialized = true;
    reportError(new Error("boom"), { source: "test" });

    expect((datadogRum as any).addError).toHaveBeenCalledTimes(1);
  });
});


