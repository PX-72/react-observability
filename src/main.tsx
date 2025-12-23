import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initTelemetry } from './telemetry/telemetry';
import './styles.css';
import { ErrorBoundary } from './components/ErrorBoundary';

initTelemetry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);


