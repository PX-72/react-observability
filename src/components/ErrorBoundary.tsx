import { Component, type ErrorInfo, type ReactNode } from 'react';
import { rum } from '../telemetry/rum';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorId: string | null;
};

function createErrorId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, errorId: createErrorId() };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    rum.addError(error, {
      boundary: 'ErrorBoundary',
      componentStack: info.componentStack,
      errorId: this.state.errorId,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className='container'>
        <h1 style={{ fontSize: 18, margin: '0 0 10px' }}>Something went wrong</h1>
        <div className='muted' style={{ fontSize: 13 }}>
          Reload the page. If this keeps happening, include error id{' '}
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {this.state.errorId ?? 'unknown'}
          </span>
          .
        </div>
      </div>
    );
  }
}


