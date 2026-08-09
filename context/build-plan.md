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

## Phase 2 — Providers and alignment (test-first)

The core of the project. No UI in this phase.

- [ ] `features/energy-prices/types` — `RawEnergyPrice` + domain `EnergyPrice`
- [ ] `features/weather-forecast/types` — `RawHourlyWeather` + domain shape, columnar
- [ ] Parse/validate at each boundary: `unknown` → domain, rejecting malformed payloads
- [ ] `features/*/api` — server fetchers with timeouts, `use cache` + explicit `cacheLife`
- [ ] Discriminated-union results per source, including `not-published`
- [ ] `market-correlation/utils` — timestamp alignment, pure, clock injected

Tests required before moving on: provider parsing, timezone-aware alignment, malformed
and unequal-length arrays, missing values staying missing, the DST 23/25-hour days, the
not-yet-published branch.

**Gate:** `pnpm test` green; alignment provably correct without a running app.

---

## Phase 3 — Page composition and states

- [ ] `src/app/page.tsx` as server conductor: await `searchParams`, fetch both sources
      concurrently with `Promise.allSettled`
- [ ] URL params for selected day and metric, with validated fallbacks
- [ ] Every state rendered per `ui-rules.md`: loading, no data, not published, partial,
      stale, provider error — each with the right status family, icon **and** text
- [ ] Retry where retrying helps
- [ ] Source attribution and last-fetched time visible
- [ ] `<Suspense>` around request-time content so the shell still prerenders

**Gate:** each state reachable and correct with the network throttled or forced to fail;
a dead weather provider still renders the price experience.

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

## Phase 5 — Cards, insights, accessible data view

- [ ] Summary cards: current-hour price, daily average, lowest hour, highest hour,
      selected metric at the current hour
- [ ] Deterministic insights only — min/max hour, peak timing, evening vs daily average
- [ ] Expandable data table: timestamp, price, weather value, units
- [ ] Concise text summary so the chart is not the only way to understand the result

**Gate:** cards, chart, insights, and table all read the **same validated dataset** — no
second derivation path. VAT/grid-charge exclusion stated where prices appear.

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
