# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick-reference commands

```bash
npm run dev           # start with hot-reload (ts-node-dev)
npm run build         # compile TypeScript → dist/
npm start             # run compiled output (requires build first)
npm run type-check    # type-check without emitting
npm run lint          # ESLint across src/
npm test              # Jest (all *.test.ts files)
npm run test:watch    # Jest in watch mode
npm run test:coverage # Jest with coverage report
```

Smoke-test the running server:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/weather/London
curl http://localhost:3000/forecast/Paris
```

---

## Architecture

Seven source modules under `src/`, zero circular dependencies:

```
types.ts          ← imported by everything that needs a type
weather.ts        ← pure logic, no I/O
dashboard.ts      ← HTML rendering, calls weather.ts
routes.ts         ← Express Router, calls weather.ts + dashboard.ts
logger.ts         ← structured JSON logger, no imports from this repo
middleware.ts     ← Express middleware, calls logger.ts
server.ts         ← entry point, wires everything together
```

### Module responsibilities

| File | Exports | Notes |
|---|---|---|
| `types.ts` | `WeatherData`, `ForecastDay`, `ForecastResponse`, `HealthResponse`, `Temperature` | Only file that other modules import types from |
| `weather.ts` | `getWeather(city)`, `getForecast(city)` | Pure. FNV-1a hash → mulberry32 PRNG. Same city always returns same output |
| `dashboard.ts` | `renderDashboard()` | Renders full HTML for `GET /`. Five hardcoded cities; no caching |
| `routes.ts` | `router` (default) | Four endpoints, typed `Response<T>` generics |
| `logger.ts` | `logger` | `.info()`, `.warn()`, `.error()` — writes newline-delimited JSON to stdout/stderr |
| `middleware.ts` | `requestId`, `requestLogger`, `notFound`, `errorHandler` | Express middleware; augments `Request` with `requestId: string` |
| `server.ts` | `app` (default) | Builds the app, mounts middleware, handles graceful shutdown |

### Middleware stack (order is significant)

```
requestId       → stamps every request with a correlation ID; echoes X-Request-Id header
requestLogger   → logs method/path/status/duration on response finish
router          → the four application routes
notFound        → 404 JSON for any unmatched route
errorHandler    → 4-arg Express error handler; logs internally, sanitizes response for prod
```

### API endpoints

| Method | Path | Handler | Response type |
|---|---|---|---|
| GET | `/` | `renderDashboard()` | `text/html` |
| GET | `/health` | inline | `HealthResponse` |
| GET | `/weather/:city` | `getWeather(city)` | `WeatherData` |
| GET | `/forecast/:city` | `getForecast(city)` | `ForecastResponse` |

---

## Logging

`logger.ts` writes newline-delimited JSON to stdout (`info`/`warn`) and stderr (`error`). Never use `console.log` — use the logger so all output is structured and parseable.

Every log entry includes at minimum: `timestamp` (ISO 8601), `level`, `message`.

Request logs (emitted by `requestLogger` middleware) always include: `requestId`, `method`, `path`, `status`, `durationMs`.

Error logs (emitted by `errorHandler`) always include: `requestId`, `method`, `path`, `stack` — stack is **logged** but never sent to clients in production.

Example output:

```json
{"timestamp":"2026-05-17T12:00:00.000Z","level":"info","message":"server started","port":3000}
{"timestamp":"2026-05-17T12:00:01.123Z","level":"info","message":"request completed","requestId":"lbv2k9xd3","method":"GET","path":"/weather/London","status":200,"durationMs":2}
{"timestamp":"2026-05-17T12:00:02.456Z","level":"error","message":"something broke","requestId":"lbv2k9xd4","stack":"Error: ..."}
```

---

## Error handling

All errors flow through `errorHandler` in `middleware.ts`. Route handlers do **not** catch their own errors — Express 4 propagates synchronous throws automatically.

`NODE_ENV` controls response verbosity:

| `NODE_ENV` | Client response | Logged |
|---|---|---|
| `production` | `{ error, requestId }` only | Full stack trace |
| anything else | `{ error, requestId, detail }` | Full stack trace |

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server binds to |
| `NODE_ENV` | _(unset)_ | Set to `production` to suppress error detail in responses |

---

## Testing

**Stack:** Jest + ts-jest (no separate compile step) + Supertest for HTTP integration tests.

**Test files** are co-located with the module they test (`src/*.test.ts`).

**Current test files:**

| File | Type | What it covers |
|---|---|---|
| `src/weather.test.ts` | Unit | `getWeather` and `getForecast` — determinism, ranges, exact seeded values |
| `src/routes.test.ts` | Integration | All four endpoints via Supertest; asserts status, body shape, exact London values |

**Key conventions:**

- Import `app` from `./server` in integration tests — the `require.main === module` guard ensures `listen` is not called during test runs.
- Never mock `getWeather` or `getForecast` — they are pure and deterministic.
- Assert exact PRNG-seeded values (London = 41 °C, Foggy, humidity 68, wind 20 km/h) so PRNG regressions are caught immediately.
- Coverage target: 80 % lines minimum; `weather.ts` must reach 100 %.

**Jest config** (`jest.config.js`):

```js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
};
```

---

## CI/CD

`.github/workflows/ci.yml` — triggers on every push to `main` and every PR targeting `main`.

```
test job
  ├── npm run lint
  ├── npm run type-check
  └── npm test -- --coverage

build job  (needs: test)
  └── npm run build

security job  (needs: test)
  └── npm audit --audit-level=high
```

`build` and `security` run in parallel once `test` is green. A failure in any job blocks the merge.

---

## Deployment

**Build for production:**

```bash
npm run build        # outputs to dist/
NODE_ENV=production node dist/server.js
```

**Health check:** `GET /health` → `{ "status": "ok" }` — use as the liveness probe in any orchestrator.

**Graceful shutdown:** The server handles `SIGTERM` and `SIGINT`. It stops accepting connections, drains in-flight requests, and exits cleanly. A 10-second hard timeout prevents indefinite hangs. Kubernetes and PM2 both send `SIGTERM` before force-killing — no extra configuration needed.

**PM2:**

```bash
pm2 start dist/server.js --name weather-api --env production
pm2 save
```

**Docker:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
```

Build the image only after `npm run build` — do not copy `src/` or `node_modules` into the image.

**Pre-deploy checklist** (or run `/deploy-check`):

1. `npm run type-check` — zero errors
2. `npm run lint` — zero errors
3. `npm test` — all tests pass
4. `npm run build` — clean compile
5. `npm audit --audit-level=high` — zero high/critical vulns
6. `curl localhost:3000/health` — responds `{ "status": "ok" }`

---

## Key constraints and gotchas

- **Node 10 compatibility:** `tsconfig` target is `ES2017`. TypeScript downcompiles `?.` and `??`, but always verify with `npm run build` after using newer syntax.
- **XSS latent risk in `dashboard.ts`:** `w.city` is interpolated directly into HTML (line ~32). Currently safe — cities are hardcoded constants. If the dashboard ever renders a user-supplied city name, add an `escapeHtml` helper before the interpolation.
- **`condition` is typed as `string`**, not a union of the 10 values in `CONDITIONS` (`weather.ts`). Narrow it to a literal union if the type surface grows.
- **Request IDs are not cryptographically random** — they are `Date.now().toString(36) + Math.random()`, sufficient for log correlation but not for security tokens.
- **No database** — all data is generated on the fly from the PRNG; there are no migrations or connection pools to manage.
- **Logger goes to stdout/stderr** — configure your log aggregator (Datadog, CloudWatch, Loki) to collect from those streams. No log files are written to disk.
