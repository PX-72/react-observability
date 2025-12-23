import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('../telemetry/rum', () => ({
  rum: {
    init: vi.fn(),
    addError: vi.fn(),
    addAction: vi.fn(),
    addTiming: vi.fn(),
  },
}));

const { rum } = await import('../telemetry/rum');

function ComponentWithError(): JSX.Element {
  throw new Error('error');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI and reports error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ComponentWithError />
      </ErrorBoundary>,
    );

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(rum.addError).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });
});


