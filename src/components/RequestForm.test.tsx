import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestForm } from "./RequestForm";

vi.mock("../telemetry/w3cTraceContext", () => ({
  generateTraceparent: () => ({
    traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
    traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    parentId: "bbbbbbbbbbbbbbbb",
    traceFlags: "01",
  }),
}));

vi.mock("../api/fetchWithTrace", () => ({
  fetchWithTrace: vi.fn(),
}));

const { fetchWithTrace } = await import("../api/fetchWithTrace");

describe("RequestForm", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("disables submit until request name is provided", async () => {
    const user = userEvent.setup();
    render(<RequestForm />);

    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/request name/i), "My request");
    expect(submit).toBeEnabled();
  });

  it("shows traceparent used for a submission attempt and success state", async () => {
    (fetchWithTrace as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
      response: new Response("ok", { status: 200, headers: { "content-type": "text/plain" } }),
      data: "ok",
    });

    const user = userEvent.setup();
    render(<RequestForm />);

    await user.type(screen.getByLabelText(/request name/i), "My request");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/success/i)).toBeInTheDocument();
    expect(
      screen.getByText("00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01"),
    ).toBeInTheDocument();
  });

  it("renders an error state when response is not ok", async () => {
    (fetchWithTrace as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
      response: new Response("no", { status: 500, headers: { "content-type": "text/plain" } }),
      data: "no",
    });

    const user = userEvent.setup();
    render(<RequestForm />);

    await user.type(screen.getByLabelText(/request name/i), "My request");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/request failed/i)).toBeInTheDocument();
  });
});


