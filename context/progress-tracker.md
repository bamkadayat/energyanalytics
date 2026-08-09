# Progress Tracker

Living status for **Nordic Power & Weather Explorer**. Per `AGENTS.md`, update this file
after every feature — alongside `ui-registry.md`.

**Last updated:** 2026-08-09
**Current phase:** Phase 2 complete → Phase 3 next
**Gates:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 84 passed · `pnpm build` ✅

---

## Workflow

**GitHub Flow.** `main` is always deployable. One short-lived task branch per slice →
PR → `main`. No long-lived `dev` branch (it was dropped in Phase 1; it sat on the same
commit as `main` and only added a second merge per change).

Branch naming follows Conventional Commits: `chore/`, `test/`, `feat/`, `docs/`.
Keep commits small and individually green — never batch a phase into one commit.

---

## Phase status

| Phase | Status |
| --- | --- |
| 0 — Foundation | ✅ merged |
| 1 — Dependencies and configuration | ✅ merged |
| 2 — Providers and alignment | ✅ complete |
| 3 — Page composition and states | ⬜ next |
| 4 — Chart | ⬜ not started |
| 5 — Cards, insights, data view | ⬜ not started |
| 6 — Accessibility, performance, polish | ⬜ not started |

### Open pull requests

`feat/provider-fetchers` — the last Phase 2 slice. Everything earlier is merged.

---

## Completed

### 2026-08-09 — Phase 2: providers and alignment

Six slices. No UI; the riskiest logic proven before anything renders. 84 tests.

- **energy-prices** — raw→domain parser. Domain type is narrower than the provider's
  (EUR and exchange rate dropped at the boundary). Invalid entries are dropped and
  counted, never repaired; an empty array is a successful parse, not an error.
- **weather-forecast** — columnar parser. Refuses naive timestamps rather than guessing
  a zone. A length-mismatched column is marked unavailable and null-filled, never
  truncated, because the arrays are positional.
- **market-correlation** — the hour join. Joins on a normalized hour key, never array
  index; returns the union of both sources so a one-sided hour stays visible.
- **shared/lib/oslo-day** — all zone-aware work in one place. Day arithmetic on the
  calendar, not on milliseconds.
- **shared/lib/fetch-json** — every failure mode as a value; nothing throws.
- **providers/api** — cached fetchers, lifetime chosen by which function is called.

Contract bugs caught by checking the live APIs instead of assuming:

- Open-Meteo returns wind in **km/h** by default while config declared m/s — every
  reading would have been ~3.6x too large under a correct-looking label. Pinned via
  `WEATHER_REQUEST_PARAMS`.
- The price API returns **404 with an HTML body** for an unpublished day, not an empty
  array. The 404 body is never parsed.
- `timeformat=unixtime` confirmed working, which is what lets the weather parser reject
  ambiguous timestamps outright.

Verified end to end with a temporary probe: `prices:ok weather:ok` from the live APIs,
then reverted.

### 2026-08-09 — Phase 1: dependencies and configuration

Four slices, one commit each:

- **Runtime deps** — echarts 6.1.0, echarts-for-react 3.0.6 (peer range is
  `react >=16`, so React 19.2.8 needs no override), date-fns 4.4.0, @date-fns/tz 1.5.0.
  Plain date-fns cannot do IANA zone conversion; the v4 companion supplies `TZDate`.
- **Test harness** — vitest 4 + @vitejs/plugin-react + jsdom, RTL 16 (supports React 19),
  jest-dom matchers. `vitest.config.mts` duplicates the `@/* → ./src/*` alias because
  Vitest does not read tsconfig paths. `.mts` avoids the CJS/ESM warning from Vite's
  native config loader. Globals stay off so `tsconfig` needs no `types` override, which
  would shadow default `@types` resolution. Added `typecheck`, `test`, `test:watch`.
- **Cache Components** — `cacheComponents: true`. Isolated because it changes rendering
  semantics app-wide: PPR becomes default, request-time APIs must sit inside
  `<Suspense>`, and the app is pinned to the Node.js runtime.
- **Shared config** — `src/shared/config` as the single door for `Europe/Oslo`, NO1,
  Oslo coordinates, base URLs, the three weather variables with units, request timeout,
  publication hour, and `cacheLife` profiles.

### 2026-08-09 — Phase 0: foundation

- Moved `app/` → `src/app/`; `@/*` now resolves to `./src/*`. `features/` does not exist
  yet; `shared/` was created in Phase 1.
- Design tokens in `src/app/globals.css` as a single stylesheet: foundation scale →
  semantic tokens in `:root` → `@theme` Tailwind bridge, plus the base layer (body,
  global `:focus-visible` ring, `prefers-reduced-motion`).
- Semantic tokens kept as real `:root` custom properties so the ECharts canvas can read
  them via `getComputedStyle` — canvas cannot consume `var()`.
- Renamed tokens that would have produced awkward utilities: `--color-text-*` → `--fg-*`,
  `--color-border-*` → `--line*`, `--color-*-text` → `--*-fg`. Promoted the one inline
  literal (`#bae6fd`) to `--nordic-200`.
- Extended beyond color: radii, shadows, `--container-content`, fluid `--text-display`,
  `--chart-min-height`. Spacing left on Tailwind's default scale.
- Cleared Tailwind's default palette (`--color-*: initial`) and added a
  `no-restricted-syntax` guard in `eslint.config.mjs` rejecting hex values, color
  functions, and raw palette classes. Verified it fires on all four violation forms.
- Light-only theme; scaffold's `prefers-color-scheme: dark` block removed,
  `color-scheme: light` pinned.
- Verified in the built CSS that token utilities emit, the raw palette is gone, and
  semantic tokens survive in `:root` for the chart.
- Context docs written: `architecture.md`, `ui-tokens.md`, `ui-rules.md`,
  `code-standards.md`, `library-docs.md`, `build-plan.md`, this file.

---

## Open decisions

| Question | Status |
| --- | --- |
| `AGENTS.md` rule 4 says "run `/recover`", but `skills/` was deleted — the skill does not exist | **unresolved**: restore under `.claude/skills/` (where they would actually be invocable) or edit the rule |
| `ui-registry.md` does not exist yet, though `AGENTS.md` requires updating it every feature | create at `context/ui-registry.md` before the first component (Phase 4) |
| ~~`PROJECT_DESCRIPTIONS.md` duplicates `project-overview.md`~~ | ✅ resolved — deleted |
| ~~`ui-registry.md` location ambiguity~~ | ✅ resolved — `context/`, since `skills/imprint` is gone |
| ~~date-fns timezone companion package~~ | ✅ resolved — `@date-fns/tz` 1.5.0 |

---

## Known risks

- **Chart palette separates by hue alone.** All four series sit at near-identical
  luminance; the solid-vs-dashed distinction is what satisfies "never rely on color
  alone." Do not simplify the line styles. See `ui-tokens.md`.
- **Tomorrow's prices publish ~13:00 Europe/Oslo.** A miss must not be cached at the same
  lifetime as a hit. `CACHE_PROFILE.pricesPending` exists for exactly this.
- **Alignment must join on normalized timestamps, never array index.** DST days have 23
  or 25 hours.
- **Cache Components is on**, so `searchParams` and other request-time APIs must live
  inside a `<Suspense>` boundary, and no route may set `runtime = 'edge'`.
- **Reading the clock needs `await connection()`.** `new Date()` in a server component
  fails the build with `blocking-prerender-current-time`, and `<Suspense>` alone does not
  fix it. Verified. Affects day selection, current-hour lookup, and the
  prices-published check. See `library-docs.md`.
- **`WEATHER_REQUEST_PARAMS` must stay on every Open-Meteo request.** Drop it and the
  units silently stop matching their labels.
- **Generated route types** (`LayoutProps`/`PageProps`) only exist after `next dev` or
  `next build`; a cold clone type-errors until then.
- **The Vitest alias is a second copy** of the `@/*` mapping. Changing it in
  `tsconfig.json` means changing `vitest.config.mts` too.
