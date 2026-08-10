# Architecture

Authority for structure, boundaries, and data flow in **Nordic Power & Weather Explorer**.
Scope: where code lives, what may import what, and how data moves from provider to pixel.
Visual tokens live in `ui-tokens.md` / `ui-rules.md`; conventions live in `code-standards.md`;
sequencing lives in `build-plan.md`.

---

## 1. Directory layout

```text
src/
  app/
    layout.tsx           # root shell, fonts, metadata
    page.tsx             # server component — the conductor
    globals.css          # Tailwind v4 entry + @theme token block
  features/
    energy-prices/
      api/               # provider fetch + parse/validate
      components/
      types/             # raw provider types + domain types
      utils/             # pure normalization/derivation
      index.ts           # public API — the ONLY entry point
    weather-forecast/
      api/ components/ types/ utils/ index.ts
    market-correlation/
      components/ types/ utils/ index.ts
  shared/
    config/              # env + constants, validated once
    lib/                 # generic helpers (time, number, fetch)
    types/               # generic types, no business domain
    ui/                  # presentational primitives, domain-agnostic
```

**Migration: done.** `app/` moved to `src/app/` and the `@/*` alias in `tsconfig.json`
now points at `./src/*`, so `@/features/...` resolves. Next.js supports either location;
`src/` was chosen so `features/` and `shared/` sit beside the route layer rather than
polluting the repo root. `features/` and `shared/` do not exist yet — the first feature
creates them.

`src/app/globals.css` is the only stylesheet — design tokens plus the base layer. See
`ui-tokens.md` for the layering and why the semantic layer must stay in `:root`.

`market-correlation` has no `api/` by design — it owns no provider. It composes what the
other two features expose.

---

## 2. Layers and allowed import directions

| From ↓ / May import → | `app/` | `features/*` (public) | `features/*` (internal) | `shared/` |
| --- | --- | --- | --- | --- |
| `app/` | — | ✅ | ❌ | ✅ |
| `features/A` | ❌ | ✅ (via `index.ts`) | ❌ | ✅ |
| `shared/` | ❌ | ❌ | ❌ | ✅ |

Three rules follow from the table, and they are the ones that actually get violated:

1. **`shared/` never imports a feature.** If something in `shared/` needs to know what a
   spot price is, it is not shared — move it into the feature.
2. **Cross-feature imports go through the barrel.**
   `import { type EnergyPrice } from "@/features/energy-prices"` — never
   `.../energy-prices/types/internal`. The barrel is the contract; everything else is
   free to be refactored.
3. **Features never import from `app/`.** Route concerns flow downward as props only.

A feature may expose a second entry, `client.ts`, carrying only what is safe in a browser
bundle — pure functions and types with no server dependencies. `index.ts` re-exports
server components and, through them, `use cache` fetchers; importing it from a client
component pulls those into the client build and **fails the build**. The second entry
exists so client code has somewhere legitimate to import from instead of deep-importing
internals.

Keep barrels deliberate — export the domain types, the fetch entry point, and the
components the page mounts. Do not re-export every internal util; an exhaustive barrel is
the same as no boundary at all, and it invites cycles.

---

## 3. Type layers

Three distinct shapes, never collapsed into one:

```text
RawEnergyPrice / RawHourlyWeather   →   domain (validated, normalized)   →   view (chart/table-ready)
   provider shape, untrusted             Europe/Oslo-aligned, typed          only what a component renders
```

- **Raw** types mirror the provider byte-for-byte and live next to the adapter that
  parses them. They never escape the feature's `api/` + `types/` pair.
- **Domain** types are the validated result. Crossing from raw → domain is the *only*
  place `unknown` is narrowed. Never `any`.
- **View** types are what components receive — narrow props, no fetch implementations.

Keep units in the name or the type (`nokPerKwh`, `windSpeedMs`) wherever a bare number
could be misread. This is a domain with three different units on two axes; ambiguity here
becomes a wrong chart, not a type error.

---

## 4. Server / client boundary

`src/app/page.tsx` is a **server component and a conductor**: it resolves URL state,
triggers the two independent fetches concurrently, and renders. It contains no
`"use client"`.

```
page.tsx (server)
├── reads searchParams  ─────────────► date + metric (request-time)
├── Promise.allSettled([ getPrices(date), getWeather(date) ])   ← concurrent, isolated
└── renders
    ├── <SummaryCards />        server — derived values, no interactivity
    ├── <CorrelationChart />    "use client" — ECharts needs the DOM
    ├── <Controls />            "use client" — date + metric selectors
    └── <DataTable />           server shell, client disclosure leaf only
```

`Promise.allSettled`, not `Promise.all` — one provider failing must not take down the
other (see §6). Mark only interactive **leaves** with `"use client"`. The chart is a
client component; the section wrapping it is not.

Pass only what renders. The client receives the selected day and the requested metric —
not the full multi-day payload, not the raw provider response.

---

## 5. State: one owner each

| State | Owner | Notes |
| --- | --- | --- |
| Selected date (today/tomorrow) | URL search param | linkable, restorable |
| Selected weather metric | URL search param | linkable, restorable |
| Fetched price/weather data | server → props | never mirrored into client state |
| Chart hover / zoom | local to chart | ephemeral, never lifted |
| Averages, min/max, insights | **derived during render** | never stored |

No Redux, no Zustand, no Context for this prototype. No effect that synchronizes a value
which could have been computed during render — if an effect writes state that is a pure
function of props, delete it and compute inline.

`searchParams` is a Promise in this Next version and must be awaited. It is a
**request-time API**, so where it is read decides how much of the page can prerender.
Read it at the page, then pass resolved primitives *down* — and into cached functions as
arguments (§6).

---

## 6. Fetching, caching, failure isolation

Fetch on the server. Each feature owns its adapter in `api/`; the page never calls
`fetch` directly.

**Caching model.** Use Cache Components — set `cacheComponents: true` in
`next.config.ts`, then mark each fetcher with `use cache` and give it an explicit
`cacheLife`. Pair every cache directive with a lifetime; the implicit `default` profile is
not a decision. Arguments form the cache key, so passing the resolved date in from
`searchParams` yields one entry per day for free:

```ts
// features/energy-prices/api/get-prices.ts
export async function getPrices(date: string) {
  "use cache";
  cacheLife("hours");
  // ...
}
```

Lifetimes reflect provider behavior, not convenience:

| Data | Profile | Why |
| --- | --- | --- |
| Weather forecast | `hours` | Open-Meteo republishes on a slow cadence; ~1h is the stated target |
| Today's prices | `hours` | day-ahead prices are settled and will not change |
| **Tomorrow's prices, unpublished** | short / uncached | publishes ~13:00 Europe/Oslo — a long cache here hides prices that have since appeared |

That last row is the trap: a miss for tomorrow must not be cached at the same lifetime as
a hit. Branch on the outcome.

**Failure isolation.** Partial success is a first-class result, not an error. Model the
outcome as a discriminated union per source and let the page render whatever succeeded:

```
loading │ ok │ no-data │ not-published-yet │ partial │ stale │ provider-error
```

Prices loaded + weather failed ⇒ render the price experience with a weather warning.
Never fabricate fallback market or weather values — mock data belongs in tests or an
explicitly labeled demo mode. Use request timeouts and return controlled domain errors;
do not let a provider exception become a 500. Offer retry only where retrying can help.

---

## 7. Alignment: the core domain rule

The two providers disagree about shape. Prices arrive as an array of objects with
`time_start`/`time_end`; weather arrives columnar, as parallel arrays.

- Join on a **normalized hourly timestamp**, never on array index. The arrays can differ
  in length, start hour, or DST behavior, and index-joining silently mismatches rows.
- `Europe/Oslo` everywhere — fetching, day selection, labels, matching. One timezone
  constant in `shared/config`, no local literals.
- Validate array lengths and numeric values before anything reaches the chart.
- Missing stays missing. Never coerce a gap to `0` — a zero price and an absent price
  render identically and mean opposite things.

Alignment lives in **pure functions in `utils/`**, taking data and returning data. This is
the most test-critical code in the project (`build-plan.md` sequences it first) and it must
be testable without React, without network, and without a clock.

---

## 8. Data shape and performance

- Preserve Open-Meteo's **columnar arrays**. Do not eagerly expand 24 hours × 3 metrics
  into objects; feed ECharts `dataset` or series data directly.
- Normalize once, on the server. Avoid repeated full-array transforms during render.
- Memoize derived chart options only when data size or measurement justifies it.
- Canvas renderer; nonessential animation disabled; respect `prefers-reduced-motion`.
- Measure before optimizing, and separate the axes: payload, server latency, bundle size,
  React render cost, chart render cost. They have different fixes.

---

## 9. Configuration

One validated module under `shared/config`, read at the boundary — never scattered
literals, never `process.env` reads deep in a feature:

API base URLs · `NO1` code + display label · Oslo lat/lon + label · `Europe/Oslo` ·
supported metrics with their units · cache profiles · feature flags.

Both providers are public and unauthenticated, so there are no secrets today. Keep the
module the single door anyway, so that stays true by construction.

---

## 10. Definition of architecturally done

- No deep imports across features; every cross-feature reference resolves via `index.ts`
- No `any`; `unknown` narrowed only at the provider boundary
- Cards, chart, insights, and table all read the **same validated dataset**
- Server/client split is leaf-level, not page-level
- Every cache directive has an explicit `cacheLife`
- Partial failure renders a useful page
- Update `progress-tracker.md` and `ui-registry.md` after every feature
