import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { initDatadogRum } from "./telemetry/datadog";
import "./styles.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

initDatadogRum();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);


