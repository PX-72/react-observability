# React Observability Reference App (Datadog RUM + Datadog Logs + W3C Trace Context)

Small reference app showing three separate things:

- **Datadog RUM**: session/view timeline + RUM Explorer events
- **Datadog Logs**: log events in Log Explorer
- **W3C Trace Context**: `traceparent` generation and propagation on `fetch`

## Datadog RUM (Session Explorer / RUM Explorer)

RUM is initialized in `src/telemetry/datadogRum.ts` and exposed via `src/telemetry/rum.ts`.

- **Auto-captured** (when enabled): views, resources, user actions, errors, long tasks
- **Manual capture in this app**:
  - `rum.addError(error, context?)` (used by `ErrorBoundary` and for handled errors)
  - `rum.addAction(name, context?)` (used on request submit)
  - `rum.addTiming(name, time?)` (used on request submit)
- **JSX/HTML instrumentation**:
  - `data-dd-action-name='...'` on an element (or parent) names the captured click action

Where it shows up:
- RUM actions/errors/timings show up under **RUM Explorer / Session Explorer**

## Datadog Logs (Logs / Log Explorer)

Logs are initialized in `src/telemetry/datadogLogs.ts` and exposed via `src/telemetry/logs.ts`.

- `log.debug/info/warn/error(...args)` always logs to the local console
- Remote sending goes to Datadog Logs and is filtered by `remoteLogLevel` (default `'info'`)
- `localOnly: true` disables remote log sending

Where it shows up:
- Remote log events show up under **Logs (Log Explorer)** (not under RUM)

## W3C Trace Context (`traceparent`)

This app generates a version `00` `traceparent` and injects it via `fetchWithTrace`:

- `src/telemetry/w3cTraceContext.ts` generates `traceparent`
- `src/api/fetchWithTrace.ts` sets the `traceparent` header
- UI displays the exact `traceparent` for the last submission attempt (observed via `onTraceparent`, not generated in the component)

If RUM is enabled, `allowedTracingUrls` is scoped to same-origin `/api/*` so first-party tracing stays scoped.

## Setup (Vite env vars)

RUM is a no-op unless these are set:

```bash
VITE_DD_RUM_APPLICATION_ID=...
VITE_DD_RUM_CLIENT_TOKEN=...
VITE_DD_SITE=datadoghq.com
VITE_DD_SERVICE=react-observability
VITE_DD_ENV=local
VITE_DD_VERSION=0.1.0
```

Logs are a no-op unless a logs token is set (or you reuse the RUM client token for the demo):

```bash
VITE_DD_LOGS_CLIENT_TOKEN=... # optional; falls back to VITE_DD_RUM_CLIENT_TOKEN
```

Telemetry init happens in `src/main.tsx` via `src/telemetry/telemetry.ts` (`initTelemetry()`).

## Dev / test

```bash
npm install
npm run dev
npm test
```


