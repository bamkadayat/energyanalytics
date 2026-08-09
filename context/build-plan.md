# Build Plan

Sequenced phases for **Nordic Power & Weather Explorer**. Each phase has an exit gate;
do not start the next phase until the current one passes its gate.

Current status lives in `progress-tracker.md` — update it after every phase.

The ordering principle: **the risky, testable, un-mockable logic goes first.** Timestamp
alignment is where this project can quietly produce a wrong chart, so it is built and
tested before anything renders.

---

## Phase 0 — Foundation ✅ complete

Scaffold, `src/` layout, design tokens, enforcement.

- [x] `app/` → `src/app/`, `@/*` alias → `./src/*`
- [x] Design tokens + base layer in `src/app/globals.css`
- [x] Tailwind default palette cleared; ESLint token guard added
- [x] Context docs written

**Gate:** `pnpm lint` and `pnpm build` pass. ✅

---

## Phase 1 — Dependencies and configuration ✅ complete (in review)

One commit per item, per the workflow in `progress-tracker.md`.

- [x] Install `echarts`, `echarts-for-react`, `date-fns` + `@date-fns/tz`
- [x] Install `vitest`, `@testing-library/react`, `jsdom`; add `test` and `typecheck`
      scripts to `package.json`
- [x] Enable `cacheComponents: true` in `next.config.ts`
- [x] `src/shared/config` — one module: API base URLs, `NO1` code + label, Oslo lat/lon +
      label, `Europe/Oslo`, supported metrics with units, cache profiles

**Gate:** new scripts run clean; no `Europe/Oslo` or coordinate literal exists outside
`shared/config`. ✅

---

## Phase 2 — Providers and alignment (test-first) ✅ complete

The core of the project. No UI in this phase.

- [x] `features/energy-prices/types` — `RawEnergyPrice` + domain `EnergyPrice`
- [x] `features/weather-forecast/types` — `RawHourlyWeather` + domain shape, columnar
- [x] Parse/validate at each boundary: `unknown` → domain, rejecting malformed payloads
- [x] `shared/lib` — Oslo day/hour helpers and `fetchJson` with timeouts
- [x] `features/*/api` — server fetchers with timeouts, `use cache` + explicit `cacheLife`
- [x] Discriminated-union results per source, including `not-published`
- [x] `market-correlation/utils` — timestamp alignment, pure, clock injected

**Gate:** `pnpm test` green (84 tests); alignment provably correct without a running
app. ✅ Additionally verified end to end against the live APIs via a temporary probe.

Carried into Phase 3: reading the clock requires `await connection()` — see
`library-docs.md`. `WEATHER_REQUEST_PARAMS` must stay on every Open-Meteo request or the
units silently stop matching their labels.

---

## Phase 3 — Page composition and states ✅ complete

- [x] `src/app/page.tsx` as server conductor, fetching both sources concurrently with
      `Promise.allSettled`. **`searchParams` is not awaited at page level** — doing so
      blocks the whole route from prerendering; the promise is passed into `<Suspense>`
- [x] URL params for selected day and metric, with validated fallbacks
- [x] Every state rendered per `ui-rules.md`, each with the right status family, icon
      **and** text
- [x] Retry where retrying helps
- [x] Source attribution and last-fetched time visible
- [x] `<Suspense>` around request-time content so the shell still prerenders — two
      boundaries, so instant controls do not wait on slow providers

**Gate:** ✅ Verified against the live APIs. Today and tomorrow render 24 aligned hours
with correct units; invalid params fall back silently. Partial failure tested by pointing
the weather base URL at an unreachable host — prices still render, with a warning naming
what failed and a retry.

Still owed from this phase: a stale-data state. Nothing currently distinguishes
"retrieved 3 hours ago" from fresh, beyond the timestamp itself.

---

## Phase 4 — The chart

- [ ] `CorrelationChart` as a `"use client"` leaf
- [ ] Price solid + area fill on left axis; metric **dashed** on right axis
- [ ] Colors resolved via `getComputedStyle(...).trim()`, never inlined
- [ ] Axis-triggered crosshair tooltip, both values, same timestamp
- [ ] Legend, axis labels, units, date, timezone
- [ ] Canvas renderer, animation off, `--chart-min-height`, no fixed pixel height
- [ ] Non-causation qualifier rendered adjacent to the chart
- [ ] Gaps render as gaps

**Gate:** dual axes obviously independent; chart legible at 200% zoom and at 360px wide;
`/imprint` run.

---

## Phase 5 — Cards, insights, accessible data view ✅ complete

- [x] Summary cards: current-hour price, daily average, cheapest hour, most expensive
      hour, selected metric now and at its peak
- [x] Deterministic observations only — min/max hour, metric peak, evening vs daily
      average. A test asserts no causal vocabulary appears
- [x] Expandable data table: hour, price, weather value, units — `<details>`-based, no
      client JavaScript
- [x] Concise text summary alongside the chart

**Gate:** ✅ cards, chart, observations and table all read one `deriveDaySummary` call
over the same aligned dataset — there is no second derivation path. The VAT/grid-charge
exclusion is stated in the info callout beside the chart.

---

## Phase 6 — Accessibility, performance, polish

- [ ] Manual keyboard pass over every control and the table disclosure
- [ ] Screen-reader structure check: headings, landmarks, control names, live regions
- [ ] Reflow at narrow widths and 200% zoom
- [ ] Playwright checks for the critical path
- [ ] Measure separately: payload, server latency, bundle, React render, chart render.
      Optimize only what measurement justifies
- [ ] Remove placeholder copy, dead code, unused exports

**Gate:** the Definition of Done in `project-overview.md`, in full.

---

## Standing gate for every phase

```bash
pnpm lint
pnpm typecheck     # once added in Phase 1
pnpm test          # once added in Phase 1
pnpm build
```

Never weaken a type, lint, test, or accessibility rule to make a gate pass. Update
`progress-tracker.md` and `ui-registry.md` after each phase.
