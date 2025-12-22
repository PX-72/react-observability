import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("../telemetry/datadog", () => ({
  reportError: vi.fn(),
}));

const { reportError } = await import("../telemetry/datadog");

function Boom() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("renders fallback UI and reports error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });
});


