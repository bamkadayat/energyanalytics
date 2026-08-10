# Progress Tracker

Living status for **Nordic Power & Weather Explorer**. Per `AGENTS.md`, update this file
after every feature — alongside `ui-registry.md`.

**Last updated:** 2026-08-09 (end of session)
**Current phase:** Phases 0–5 complete → Phase 6 next
**Gates:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 185 passed · `pnpm build` ✅
**Deadline:** interview Wednesday — see *Next session* below.

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

## Next session — start here

1. **Restart the dev server first.** `rm -rf .next && pnpm dev`. Verification runs of
   `pnpm build` / `next start` share `.next` with a running `pnpm dev`, which left the
   dev server stale at the end of the last session. Use a separate dist dir for
   verification if both need to run.
2. **Look at the dashboard.** Still the largest open risk, and now the redesign rests on
   it too: the ink chart panel, the KPI strip's bar heights, the dark rail and the login
   card have all been verified as *markup* but never seen rendered.
3. **Write the README.** Highest-leverage remaining item: it is still create-next-app
   boilerplate, and it is the first thing a reviewer opens. Should carry the problem, an
   architecture sketch, and the decisions with their reasoning — hour-join vs array
   index, category vs time axis, per-day cache keys, server-derived views, the
   solid/dashed accessibility constraint, both Cache Components traps.
4. **Deploy to Vercel** so there is a live URL rather than a laptop.
5. Then Phase 6: keyboard pass, 200% zoom, narrow reflow, Lighthouse and bundle numbers.

---

## Completed

### 2026-08-10 — Landing page audit

Reviewed against `project-overview.md` and the UI docs. The page could not be seen
rendered — no browser extension this session either — so verification ran against the
**served HTML and the compiled stylesheet** from the dev server.

- **Every utility class on the served page was checked against the compiled CSS.** This is
  the failure this token system is most exposed to: Tailwind's default palette is cleared,
  so a class naming a token that does not exist emits nothing and fails *silently*. All
  163 classes resolve. The ESLint guard catches hex values, not misspelled token names —
  this check covers the other half.
- **Fixed: the hero preview's three metric pills had an invisible focus ring.** They sit
  on `--surface-inverse` while the global `:focus-visible` outline is `--focus`
  (`--navy-900`) — the *same colour*, so the ring was 1:1 against its own background.
  Three keyboard-reachable links with no visible focus indicator (WCAG 2.2 §2.4.11).
  `ui-rules.md` names this exact trap; the bento cards observed it and these were missed.
- **Fixed: a dead token reference.** One highlight dot filled with
  `var(--navy-deep, var(--surface-deep))`. `--navy-deep` is declared only as
  `--color-navy-deep` inside `@theme inline`, which does not emit custom properties, so
  the fallback was always what painted. Now matches its sibling dot.
- Content checked against the domain rules: prices labelled `NOK/kWh` with the VAT/grid
  exclusion, Oslo named as representative within NO1, non-causal wording, both sources
  attributed. All hold. Real data throughout — 24 of 24 hours joined on the example day.

Then four additions, chosen from that list:

- **The demo was unreachable.** Nothing told a visitor `/dashboard` was behind a shared
  password or how to obtain one — an interviewer opening the link hit a password field and
  stopped. `/login` now prints it, gated on a **new `DEMO_PASSWORD_HINT` variable**. It is
  deliberately not `DASHBOARD_PASSWORD`: publishing a credential must be an explicit act,
  and reading the real variable would mean any deployment published its password by not
  knowing the feature existed. Unset renders nothing.
- **Open Graph, with a generated image.** `metadataBase` resolves from `SITE_URL` or
  Vercel's production URL; `opengraph-image.tsx` draws the example day's real prices as
  1,200×630 bars. Verified by fetching the route — 61 KB PNG, correct dimensions.
  `robots` is `noindex` at the layout and re-enabled only on `/`, since the dashboard and
  login have nothing to offer a crawler.
- **"How it's built"** — four decisions that can be checked against the repository,
  between the metric cards and the closing band.
- **Deleted `public/logo.png`** (934 KB, unreferenced since the SVG mark landed).

**The login route was then rebuilt as white ground, navy ink, no filled surface** — it had
been a dark `bento` card on a tinted page, two stacked surfaces framing a form with one
field. Structure is now a single hairline plus the field's own edge, and the submit button
is the only saturated element on the route.

- Button `inverse` → `primary`; `inverse` is a white pill built for the dark card.
- **The focus ring override could come out.** `--focus` is the navy primary, visible on
  white — the dark-surface version existed to work around exactly that.
- **The error message was using `--error-surface` as a foreground**, a background token
  pressed into service as text. It only passed because a pale pink happens to read on
  navy. It is `--error-fg` now, the correct pairing rather than a lucky one.
- Removed the explanatory paragraph. A labelled field and a button do not need a sentence
  describing them; the demo note carries what mattered.

Also corrected: the login card's registry entry still described a decorative price curve
removed in the polish pass, and the heading and submit button said "Login" where every CTA
leading there now says "Log in".

Still open — see *Owed work*: `hero-visual.tsx` is unreferenced, and `<html lang="en">`
sits over `nb-NO`-formatted numbers.

Then, from the **first screenshot of the hero anyone has taken**:

- **The plot had no horizontal inset.** Hour 0 mapped to `x=0`, so the midnight tick's own
  glyph was half outside the viewBox — it read as "0", not "00" — and both curves ran into
  the panel edge. `toPreviewChart` now insets by `PAD_X` and exposes `plotLeft`/`plotRight`
  so consumers stop closing paths against the raw viewBox width. It also returns
  `metricArea`, which was previously assembled in `metric-highlights.tsx` from
  `chart.width`; left alone that would have put a wedge under the right-hand end.
- **The price area was the largest and least meaningful shape on the card** — a flat white
  wash over the full height, which desaturates to grey on navy. It now lands on
  transparent at 78% and hugs its curve.
- **The metric line was flat** while the bento cards below already had a glow treatment.
  The hero — the more prominent chart — now uses the same gradient area and soft wide
  stroke, so the selected metric leads and the two sections read as one system.
- Added three `opacity 0.08` gridlines, and named the highlighted hour in a pill on the
  crosshair. The stat strip describes that hour; nothing on the chart used to say so.
- **Hero band is `min-h-[70svh]`** with content centred. `svh` over `vh` so mobile browser
  chrome cannot make it overflow, and `min-h` over `h` so it still reflows at 200% zoom.
- **The signed-out CTA promised something it did not deliver.** The hero and closing band
  said **Open the dashboard** to a visitor with no session, then handed them a password
  field. `session-cta.tsx` had argued its own rule — "a control should say exactly what it
  does, and 'Login' is a lie to someone already logged in" — and then broke it in the other
  direction. Caught by looking at the page signed out.
- **All three CTAs now read `Log in`**, and the `signedOutLabel` prop is gone. The label
  varying by placement was what let the hero drift into a claim the button could not keep;
  the control does the same thing in all three positions.
- **The navbar wordmark is now `short`** — "Power & Weather" to the eye, the full "Nordic
  Power & Weather" still in an `sr-only` span, via the prop the rail already used. The
  footer keeps the full name.
- **The navbar CTA became a text link.** Even one size down it was the hero's pill repeated
  in the same viewport. `SessionCta` gained an `appearance` prop that varies presentation
  only — never label or destination — so the three still cannot disagree about the session.
  Weighted `text-base font-semibold sm:text-lg` to answer the wordmark across the bar.
- **The hero's secondary action became a text link with an arrow.** As a `ghost-inverse`
  pill it still read as a peer of the primary. The arrow is what carries the affordance
  now that the underline is off at rest — a non-colour second signal, which is what
  `ui-rules.md`'s underline rule is actually asking for. This leaves `ghost-inverse` with
  no callers; kept and tested for the next two-actions-on-navy case.

### 2026-08-10 — The heatmap became a boxplot

`derivePriceHeatmap`, `price-heatmap.tsx`, `HeatmapTable` and the `--heat-*` ramp are all
gone, replaced by `deriveHourSpread` and `hour-spread.tsx`: one box per hour of the day,
`[min, Q1, median, Q3, max]`, drawn with ECharts' boxplot.

- **Why.** Colour intensity on a fixed scale cannot survive outliers, and this market
  produces near-zero hours regularly. The grid was two shades of blue everywhere except
  the extremes. Position has no such ceiling.
- **What it gains.** The spread. Medians give the daily shape; box heights say how much to
  trust it. The table carries the day count behind each box, since three days and thirty
  draw the same box.
- **What it loses**, stated in the caption and the registry: which *day* an extreme fell
  on. That is the duration curve's question and the hours table's.
- Quartiles are **nearest-rank, not interpolated** — these are observed prices, and a
  quartile averaged between two real hours is a price that never happened.
- `--chart-heatmap-height` went too; both range cards now share `--chart-min-height`, and
  `ViewCard` lost the per-card override that existed only for the heatmap.

### 2026-08-10 — Skeletons that predict their own replacement

- `shared/ui/skeleton.tsx` (`Skeleton`, `SkeletonRegion`) plus three composed shapes:
  `DayViewSkeleton`, `RangeViewsSkeleton`, `HoursTableSkeleton`. Each mirrors the grid,
  card count and proportions it stands in for, so nothing reflows on arrival.
- Replaced the old fallback — a sentence over three bars of unequal width, floating in a
  tall empty card.
- `dashboard/loading.tsx` **was still the pre-rail layout**: a centred column with six KPI
  cards. It now mirrors the shell. `/dashboard/hours` gained its own `loading.tsx`, since
  `loading.tsx` cascades and would otherwise resolve a chart skeleton into a table.
- Blocks are `aria-hidden`, the region carries one `role="status"` naming what is being
  waited for, and the pulse stops under `prefers-reduced-motion`.

### 2026-08-10 — Hours table: 2,160 rows, virtualized

New route `/dashboard/hours`, reached from **All hours** in the rail — the only rail entry
that is a route rather than an in-page anchor.

- **Real data, at scale.** 90 days of hourly prices and weather, joined on the hour by
  `deriveHourRows` (the wide sibling of `alignPriceAndWeather`: same normalised-hour key,
  all three metrics instead of one). One Open-Meteo request for the whole span; prices stay
  one cached request per day. Verified live: 2,160 hours, every one of them priced.
- **Sortable, filterable, paginated, virtualized** — TanStack Table for the first three,
  `@tanstack/react-virtual` for the last. Sorting and filtering run over the whole set;
  only the visible window is mounted.
- **Rows cross the boundary as primitives** — epoch milliseconds and one pre-formatted
  label — so the client never parses a timestamp or formats thousands of dates.
- Six component tests cover virtualization, whole-set sorting and filtering, pagination and
  the ARIA row count. They needed `offsetHeight`/`offsetWidth` and `ResizeObserver` stubs:
  jsdom reports zero for the first two, which makes the virtualizer render nothing.
- **Still not seen in a browser** — no extension this session. Verified through the tests
  and a `curl` of the route with a minted session cookie.

### 2026-08-10 — Colour restraint pass, landing and dashboard

Prompted by the first real look at both pages rendered. **Colour is for data now**; chrome
is navy and slate. Six decorative uses removed: the green/red left edges on the KPI cards,
the green/red delta pill, the green and red bars in the price strip, the green coverage
rule, the green scope dot, and the blue tint on the standing "How to read this" note. What
still carries colour encodes something — the chart series, the rail swatches that key them,
and the heatmap's sequential ramp.

- **One ground.** The chart moved off ink onto paper, so the dashboard is not one dark
  panel among white cards. That also fixed two things the ink hid: the grid was
  `--chart-grid-inverse` on `--surface-inverse` (**1.19:1**), and the heatmap and duration
  curve were already reading the *light* chrome tokens while sitting on that dark panel.
- **Rail selection** was the same fill as hover (1.19:1 either way). Selected now adds an
  inset ring in `--line-inverse-strong` (3.3:1); hover is the fill alone.
- Chart axis names were clipped by the top of the panel (`grid.top` 20 → 36).
- Landing: `<main>` wrapped only the hero, so the rest of the page sat outside every
  landmark. Nav and hero CTAs were the same button at the same size. Copy trimmed through
  the hero and the metric section, and the hero now previews `DEFAULT_WEATHER_METRIC`, so
  it agrees with the featured card and with what the dashboard opens on.
- New `ghost-inverse` button variant for the second action on a dark surface.

### 2026-08-10 — Login polish and dashboard redesign (unplanned)

Login card:

- **Removed the decorative price curve.** A real chart drawn too small to read, above a
  form with one field, costing a price fetch and 6rem of reserved padding.
- **Password field edge was invisible** (~1.2:1). It used `--line-inverse`, the *hairline*
  token. Added `--line-inverse-strong` (navy-500) as the dark-surface counterpart to
  `--line-strong` — 3.11:1 against the card fill, 3.30:1 against the field fill, so it
  meets WCAG 2.2 non-text contrast from either side.

Dashboard, built against a supplied reference:

- **One day switch, not two.** It existed in the rail *and* in a toolbar above the chart.
  Now a segmented pill in the header, once.
- **Header is a command bar**: day switch, price area + weather point, resolved date
  right-aligned. The date is `async` (it reads the clock) so it streams behind its own
  Suspense boundary with a same-footprint placeholder; the header shell stays static.
- **Rail went dark**, drawer with it. Metrics carry their chart colour as a swatch rather
  than a generic icon.
- **KPI row is one hero plus four.** Current price, a signed delta pill against the daily
  average, and a bar-per-hour strip scaled from zero. The four compact cards sit 2×2 at
  every width — a single row would stretch them to the hero's height, which is the flaw in
  the reference.
- **New derivation: `deriveCheapestWindow`** — the cheapest run of *consecutive* priced
  hours. A run containing a gap is skipped, not averaged over what it has.
- **Observations carry the hour as a chip** in its own column, and state each extreme
  against the daily average.
- **Chart draws on ink**, table on paper. Chrome uses `--chart-*-inverse`; the four series
  colours are shared because they clear 3:1 on both grounds (3.4:1–3.8:1, measured).
- **Legend moved from canvas to DOM**, as solid/dashed line samples. ECharts' legend is
  off.
- Verified against `next start` with a minted session cookie: every figure in the
  reference reproduced from live data (0,564 now, −47 %, cheapest 0,336 at 15:00, cheapest
  3-hour run 0,484 at 13:00–16:00, 24 of 24 hours joined). **Still never seen rendered in
  a browser** — no extension available this session.

### 2026-08-09 — Data-heavy views, dashboard shell, error handling (unplanned)

Second scope expansion, driven by the interview being with a senior frontend developer:
the goal shifted from domain depth to *handling volume well*.

- **30-day range views** — heatmap (24 rows × N day columns) and price duration curve
  with `dataZoom` and LTTB sampling. Both derived on the server: 720–1,440 hours become
  arrays of numbers, not raw rows for the browser to bucket. Verified live at 168 / 720 /
  1,440 priced hours.
- **Range length dropdown** (7 / 14 / 30 / 60). Native `<select>`; capped at 60 because
  the price API is one request per day.
- **Per-card chart/table toggle.** Both views are rendered on the server and passed as
  props, so switching is instant — no request, no re-render, no scroll jump — while the
  URL still tracks each mode via `history.replaceState`.
- **Dashboard rebuilt as an application shell** — sticky header and filter row, KPI strip
  six across, charts in a grid rather than stacked full-width.
- **Error and loading screens** — branded 404, route and global error boundaries, a
  dashboard skeleton. `retry` (not `reset`) is the Next 16.3 prop; `global-error` needs
  `globals.css` imported explicitly.

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

- **Nothing has been verified visually.** The charts, the wind scene, the animations, the
  card motifs, the new dashboard shell and the login flow have never been seen rendered —
  confidence rests on builds passing and unit tests.
- **README is still create-next-app boilerplate**, and no deploy exists.
- **No stale-data state.** Nothing distinguishes "retrieved three hours ago" from fresh
  beyond the timestamp, and `cacheLife("hours")` makes that gap real. Listed in
  `ui-rules.md`'s state table but not implemented.
- **`_components/hero-visual.tsx` is dead code** — 237 lines, unreferenced since
  `HeroPreview` replaced it in the colour-restraint pass. `ui-registry.md` still documents
  it as live, including its `videoSrc` hook. Delete it, or mark the registry entry
  superseded and say why it is being kept.
- **`DEMO_PASSWORD_HINT` must be set on the deployment**, or the login page discloses
  nothing and a cold reviewer is stuck again. It is in `.env.example` and `.env.local`;
  Vercel needs it added separately.
- **`SITE_URL` is unset**, so `metadataBase` falls back to Vercel's production URL and,
  locally, to `http://localhost:3000`. Set it if a custom domain is used.
- **The OG image duplicates six colour values** as literals, behind a narrow lint
  exemption — Satori has no stylesheet for `var()` to resolve against. They will not
  follow `globals.css`; re-check them when a colour moves.
- **No `robots.ts` / `sitemap.ts`.** Per-page `robots` metadata covers indexing for now.
- **`<html lang="en">` over `nb-NO` numbers.** Every figure is formatted with
  `APP_LOCALE = "nb-NO"` — `1,024` means one-point-oh-two-four — but the document language
  is English, so a screen reader applies English number rules and says "one thousand
  twenty-four". Correct fix is `lang="nb-NO"` on the numeric spans (WCAG 3.1.2), which
  touches the dashboard as well as the landing page.
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
