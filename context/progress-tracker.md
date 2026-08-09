# Progress Tracker

Living status for **Nordic Power & Weather Explorer**. Per `AGENTS.md`, update this file
after every feature — alongside `ui-registry.md`.

**Last updated:** 2026-08-09
**Current phase:** Phases 0–5 complete → Phase 6 next
**Gates:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 168 passed · `pnpm build` ✅

---

## Workflow

Feature branch → merge into **`dev`** → the developer merges `dev` into `main`. `dev` is
the integration branch; `main` is what ships.

> Superseded: this file previously described GitHub Flow with no long-lived `dev`
> branch. That changed partway through Phase 4.

Branch naming follows Conventional Commits: `chore/`, `test/`, `feat/`, `docs/`,
`style/`, `refactor/`, `fix/`. Keep commits small and individually green — never batch a
phase into one commit.

---

## Phase status

| Phase | Status |
| --- | --- |
| 0 — Foundation | ✅ merged |
| 1 — Dependencies and configuration | ✅ merged |
| 2 — Providers and alignment | ✅ merged |
| 3 — Page composition and states | ✅ merged |
| 4 — Chart | ✅ merged |
| 5 — Cards, insights, data view | ✅ merged |
| 6 — Accessibility, performance, polish | ⬜ **next** |

Plus an unplanned track, added on request partway through and not in `build-plan.md`:
**landing page, password authentication, and a full design pass.** See below.

---

## Completed

### 2026-08-09 — Landing page, auth and design pass (unplanned)

Scope expansion requested mid-build. `project-overview.md` originally ruled out
authentication and multi-page navigation; it now records the change.

- **Routes** — `/` static landing, `/login`, `/dashboard` (protected). The explorer moved
  from `/` to `/dashboard`.
- **Auth** — one shared password in an env var, HMAC-signed session cookie carrying only
  an expiry, `httpOnly` + `SameSite=Lax` + `__Host-` prefixed in production. Constant-time
  comparison on both the password and the signature; the password is hashed before
  comparison so a wrong-length guess is indistinguishable from wrong content. Secrets sit
  behind `server-only`, making a client import a build error. No database.
- **Proxy** — verifies the signature (Node runtime), redirecting both ways in one hop.
  Pages re-check as defence in depth.
- **Primary colour** `#0B1128`, with a navy ramp. Interaction states move *lighter*
  because the base is near-black. Contrast audit re-run; every pair passes.
- **Buttons centralised** in `shared/ui/button.tsx` — one radius (`rounded-pill`), four
  variants, three sizes, a shared hover/focus ring, all pinned by tests.
- **Own SVG logo** replacing a 900 KB PNG: inline, `currentColor`, no white badge needed.
- **Landing sections** — hero with an animated offshore wind scene, three metric cards
  linking to filtered dashboard views, closing CTA band, footer carrying the data
  qualifications.
- **Motion** — CSS-only load stagger and scroll reveals, both guarded for
  `prefers-reduced-motion`, scroll reveals behind `@supports`.

### 2026-08-09 — Phase 5: cards, observations, data table

- Summary cards, deterministic observations and an hourly table, all from **one**
  `deriveDaySummary` call over the same aligned dataset — no second derivation path, so a
  card cannot disagree with the chart beside it.
- The table is the accessible alternative to the canvas, built on `<details>` with no
  client JavaScript. Hours are row headers; the caption states that an em dash means *no
  reading*, not zero.
- A test asserts the generated observations contain no causal vocabulary
  (because / due to / driven by / correlat-…), so a future edit that reaches for one
  fails the suite.

### 2026-08-09 — Phase 4: the chart

- Dual-axis ECharts client component. Price solid with area fill on the left; the metric
  dashed on the right.
- **Category axis over server-formatted Oslo labels, not a time axis.** A time axis
  formats ticks in the *viewer's* timezone, which would relabel Norwegian market hours
  for anyone abroad while the values stayed put.
- Colours resolved from tokens via `getComputedStyle` + `.trim()`, through
  `useSyncExternalStore` rather than a `setState` in an effect — it is a browser-only
  value, not state the component owns.
- `connectNulls: false`, so a gap stays a gap.

### 2026-08-09 — Phase 3: page composition and states

- Server conductor with `Promise.allSettled` across both providers, six UI states, retry,
  and provenance stamped inside the cached scope (`withFetchedAt`).
- **`searchParams` is not awaited at page level** — that blocks the whole route from
  prerendering. The promise is passed into `<Suspense>` instead.
- Gate verified by pointing the weather base URL at an unreachable host: prices still
  render, with a warning naming the failure and offering retry.

### 2026-08-09 — Phase 2: providers and alignment

Six slices. No UI; the riskiest logic proven before anything renders.

- Parsers for both providers, refusing naive timestamps and never repairing a missing
  value into a zero.
- The hour join — on a normalized hour key, never array index; union of both sources so a
  one-sided hour stays visible.
- `shared/lib` — Oslo day/hour helpers and `fetchJson`, which turns every failure into a
  value.

Contract bugs caught by checking the live APIs instead of assuming:

- Open-Meteo returns wind in **km/h** by default while config declared m/s — every
  reading would have been ~3.6x too large under a correct-looking label.
- The price API returns **404 with an HTML body** for an unpublished day, not an empty
  array.

### 2026-08-09 — Phase 1: dependencies and configuration

echarts + echarts-for-react, date-fns + `@date-fns/tz`, Vitest + RTL + jsdom, Cache
Components enabled, and `shared/config` as the single door for every stable value.

### 2026-08-09 — Phase 0: foundation

`src/` layout, the three-layer token system in one stylesheet, Tailwind's default palette
cleared with an ESLint guard rejecting hex values and raw colour classes, and the context
docs.

---

## Open decisions

| Question | Status |
| --- | --- |
| `AGENTS.md` rule 4 says "run `/recover`", but `skills/` was deleted — the skill does not exist | **unresolved**: restore under `.claude/skills/`, or edit the rule |
| `--fg` is `--slate-900` while the primary is `--navy-900`. Both near-black, but body text is not strictly the brand colour | **open**: unify only if the navy tint is wanted on every paragraph |
| `public/logo.png` is unreferenced since the SVG mark landed, but still ~900 KB in the repo | **open**: delete, or keep as the source for an OG image |
| ~~`ui-registry.md` does not exist~~ | ✅ resolved — created in Phase 3 and maintained since |
| ~~`PROJECT_DESCRIPTIONS.md` duplicates `project-overview.md`~~ | ✅ resolved — deleted |
| ~~date-fns timezone companion package~~ | ✅ resolved — `@date-fns/tz` 1.5.0 |

---

## Owed work

- **Nothing has been verified visually.** The chart, the wind scene, the animations, the
  card motifs and the login flow have never been seen rendered — confidence rests on
  builds passing and unit tests. `pnpm dev` with the dashboard password would close most
  of this quickly.
- **No stale-data state.** Nothing distinguishes "retrieved three hours ago" from fresh
  beyond the timestamp, and `cacheLife("hours")` makes that gap real. Listed in
  `ui-rules.md`'s state table but not implemented.
- **No OG image** for link previews.
- All of Phase 6.

---

## Known risks

- **Chart palette separates by hue alone.** All four series sit at near-identical
  luminance; the solid-vs-dashed distinction is what satisfies "never rely on colour
  alone." Do not simplify the line styles.
- **Links must be underlined at rest.** `--link` is the near-black primary, so colour
  alone does not distinguish a link from body text.
- **Tomorrow's prices publish ~13:00 Europe/Oslo.** A miss must not be cached at the same
  lifetime as a hit. `CACHE_PROFILE.pricesPending` exists for exactly this.
- **Alignment joins on normalized timestamps, never array index.** DST days have 23 or 25
  hours.
- **Cache Components traps**, all hit and verified:
  - `new Date()` / `Date.now()` in a server component fails the build. Needs
    `await connection()`; `<Suspense>` alone does not fix it, and `instant = false`
    explicitly does not clear synchronous-IO errors.
  - `searchParams` awaited at page level blocks the whole route from prerendering.
  - A `redirect()` inside a streaming route commits a 200 and navigates client-side.
    Redirect in Proxy for a real 307.
- **Middleware is called Proxy in Next 16** (`proxy.ts`), and its docs are explicit that
  it is not an authorization layer. Routes must re-check.
- **`WEATHER_REQUEST_PARAMS` must stay on every Open-Meteo request.** Drop it and the
  units silently stop matching their labels.
- **Generated route types** only exist after `next dev` or `next build`; a cold clone
  type-errors until then.
- **The Vitest alias is a second copy** of the `@/*` mapping.
- **Never interpolate a Tailwind class name.** The default palette is cleared, so
  `bg-${x}-surface` emits nothing and fails silently.
