# Super Simple React Observability Reference App (Datadog RUM + W3C Trace Context)

Small reference implementation for wiring frontend observability and trace correlation in a React application.

It focuses on two things:

- Datadog RUM initialization with **first-party tracing scoping** (`allowedTracingUrls`)
- Generation and propagation of a **W3C `traceparent`** header 

It's

- initializing RUM once
- keeping tracing scoped to endpoints
- making trace context propagation inspectable


This repo generates a version `00` `traceparent` value and injects it via a `fetch` wrapper so we can inspect the exact header value used for a specific submission.


The app:

- generates a `traceparent`
- sends `POST /api/requests` with `traceparent` injected
- displays the exact `traceparent` used for that submission
- uses ErrorBoundaries to catch react element errors


RUM is intentionally a no-op unless configured via env vars.

Set these for Vite (for example in `.env.local`):

```bash
VITE_DD_RUM_APPLICATION_ID=...
VITE_DD_RUM_CLIENT_TOKEN=...
VITE_DD_SITE=datadoghq.com
VITE_DD_SERVICE=react-observability
VITE_DD_ENV=local
VITE_DD_VERSION=0.1.0
```

## Possible future improvements

- Add a tiny local dev proxy (`/api/*`) so the happy-path response is testable without changing the client call site.
- Include `tracestate` propagation when we have upstream vendors that rely on it.
- Add tests around `traceparent` format and header injection to prevent regressions.


