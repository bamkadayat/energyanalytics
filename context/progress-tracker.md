# Progress Tracker

Living status for **Nordic Power & Weather Explorer**. Per `AGENTS.md`, update this file
after every feature — alongside `ui-registry.md`.

**Last updated:** 2026-08-14 (end of session)
**Current phase:** Phases 0–5 complete → Phase 6 next
**Gates:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 230 passed · `pnpm build` ✅

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
   boilerplate, and it is the first thing a visitor opens. Should carry the problem, an
   architecture sketch, and the decisions with their reasoning — hour-join vs array
   index, category vs time axis, per-day cache keys, server-derived views, the
   solid/dashed accessibility constraint, both Cache Components traps.
4. Phase 6 polish: keyboard pass, 200% zoom, narrow reflow, Lighthouse and bundle numbers.

---

## Completed

### 2026-08-14 — Flat cards, and a way out of the hours page

Two requests, both narrowing what the UI does rather than adding to it.

- **`--shadow-card` is gone.** Its four call sites were all the *selected* segment of a
  segmented control — the actual cards were already border-only, so "remove the shadow on
  the cards" meant removing it from the toggles. Each still reads as selected on fill plus
  weight, and two of them on a border as well, so nothing lost its state indication.
  `shadow-popover` stays: the data-note tooltip genuinely floats above the page, and it is
  now the only shadow in the system.
- **`--radius-card` 0.75rem → 0.5rem**, on request. Token-level, so it reaches the login
  card and `StatusMessage` too, not only the dashboard. Isolating it to the dashboard
  would have meant a second card radius, which `ui-rules.md` forbids outright.
- **`/dashboard/hours` had no discoverable way back** — asked as a question, which is the
  finding. The rail did link home twice over, but a wordmark reads as a logo and the
  `Views` entries read as anchors on the current page, so the rail showed "All hours" as
  current with no visible exit. Now an explicit `← Dashboard` sits above the
  `Every hour, …` heading, carrying the current params. It was in the header's title row
  first and moved on request; either way it stays outside the `Suspense`, because the way
  out should not wait on ninety price requests. Mirrored in `hours/loading.tsx`.
- **The metric swatches are gone**, closing an open question the registry had already
  logged. Three dots that all resolve to `--navy-500` are not a legend. The chart is
  right to keep the tokens identical — it plots one metric at a time — but the rail lists
  all three side by side, and there the swatch had stopped doing the one thing it was
  argued for.
- **The metric group no longer renders on `/dashboard/hours`.** The hours table shows all
  three metrics as columns and ignores `params.metric`, so those three links took the
  selected fill and `aria-current` and changed nothing. `RailSkeleton` now takes `active`
  and reserves one group fewer there; a second test pins that shape too.

### 2026-08-14 — English interface, English numbers

`APP_LOCALE` was `nb-NO` in a document that is `lang="en"`.

- **This was a correctness bug, not a style choice.** `1,322` NOK/kWh means *one point
  three two two*; an English screen reader announces it as one thousand three hundred and
  twenty-two. The prior fix had been to mark the landing page's figures with `lang`
  (WCAG 2.2 §3.1.2) and log the dashboard as owed work — switching the locale removes the
  mismatch instead, and **closes that known risk** without rebuilding the markup across
  the KPI cards, tooltips and hours table.
- **`en-GB`, not `en-US`.** The same formatters produce every hour label in the app, and
  `en-US` renders `02:00 PM` where the market says `14:00`. `en-GB` keeps 24-hour time and
  day-first dates; only the separators move — `1.322` and `2,160`.
- Dates change with it: `9. aug. 2026` → `9 Aug 2026`, and `søndag 9. august 2026` →
  `Sunday, 9 August 2026`. Norwegian weekday and month names in an English interface were
  the same inconsistency in another form.
- **Found while checking the blast radius:** the hours-table search placeholder advertised
  `10.08, 14:00, august…`, but the filter is a substring test against the label
  (`10 Aug, 14:00`) — two of those three examples returned nothing, and had done since
  before this change. Now `10 Aug, 14:00…`.
- One test asserted `9,1 m/s`; updated. Nothing else in the tree hardcoded a locale.

### 2026-08-14 — Two tones on the dashboard, and a login button that opts out

Both on request. The colour question turned out to be mostly already answered.

- **Dashboard chrome was already two-tone.** The 2026-08-10 restraint pass left zero
  status-colour classes in any dashboard or market-correlation component; `ui-registry.md`
  already reads "Colour | data only". The only colour left anywhere was the chart series
  and the `warning`/`error` status banners.
- **The chart is now navy-900 (price, solid) and navy-500 (metric, dashed).** Safe because
  **only two series ever render at once** — price plus the one selected metric. The four
  hues existed because the metric varies, not because four lines coexist.
- **Contrast improved.** The old palette cleared 3:1 against `--surface` but sat at
  near-identical luminance, separating by hue alone (price vs wind ~1.06:1 against each
  other). The two tones clear 18.67:1 and 5.65:1 against the surface **and 3.30:1 against
  each other**. Measured, not estimated.
- **The solid/dashed rule got stricter, not looser.** Hue was a redundant fourth signal;
  it is now absent, so line style plus the separate axis, the units and the text legend
  carry the whole distinction. `ui-rules.md`, `ui-tokens.md`, the known-risks list and
  `series-legend.tsx` all said "four series separate by hue" and were corrected.
- **Status banners kept their colour**, deliberately. `StatusMessage` carries tone through
  colour, icon shape *and* text, so removing colour would not have failed accessibility —
  but a provider error that looks like a plain note gets missed. Colour there is the
  signal that makes you look.
- **Login button:** `radius="tight"` (6px, new `--radius-tight`) and a new `primary-soft`
  variant that swaps rest and hover fills — it rests at navy-800 and *darkens* to navy-900,
  making the ramp monotonic (800 → 900 → 950) where `primary` lightens then darkens.
- Both are **named options, not `className` overrides**: two `bg-*` or two `rounded-*`
  classes in one string resolve by CSS source order rather than by which was written last.
  A test now asserts a button emits exactly one radius class.
- **Stale doc found and marked:** `ui-tokens.md` documented a `--heat-*` heatmap ramp that
  has not existed since the heatmap became a boxplot on 2026-08-10.

### 2026-08-14 — The landing page is gone

On request: the app is login and dashboard only.

- Deleted `app/page.tsx`, its five `_components` (`hero-preview`, `metric-highlights`,
  `session-cta`, `site-footer`, `spotlight-card`), `opengraph-image.tsx`, and
  `public/hero.png` — **2.7 MB**, and its only reference was the hero.
- **`/` forwards in Proxy, not a page.** Unconditionally to `/login`; the pre-existing
  rule then carries a signed-in visitor to `/dashboard`. Branching on `signedIn` here
  would put that decision in two places. Verified against a running production build:
  signed out `/` → 307 → `/login` → 200; signed in `/` → 307 → `/login` → 307 →
  `/dashboard` → 200. No loop in either direction.
- **The Open Graph surface went too**, along with the `SITE_URL` /
  `VERCEL_PROJECT_PRODUCTION_URL` resolution that existed only to make the card's image
  URL absolute. A preview would advertise a door nobody can open.
- **Dead CSS removed:** `.animate-enter`, `.animate-reveal` and the `rise-in` keyframes
  had no consumers left — the landing page was the only one.
- Three links pointed at `/`. `error.tsx` and `not-found.tsx` now offer the dashboard;
  login's "Back to the overview" is gone, which also leaves that page with a single
  destination.
- Registry sections for the removed surfaces are marked `(removed)` rather than deleted,
  following the file's existing convention — the reasoning outlives the markup.

### 2026-08-14 — Inter for prose, and one owner for text fields

Two changes, landed together because the second was found while doing the first.

- **`Inter` replaces `Geist` as `--font-sans`** (`layout.tsx`, exposed as `--font-inter`;
  `globals.css` repoints `--font-sans`). `Geist_Mono` stays: `ui-registry.md` treats
  mono-for-data as load-bearing, marking which text is instrument readout and which is
  explanation.
- **`shared/ui/field.tsx` is now the only place text-field styling is written**, on the
  `button.tsx` precedent. Three spellings of a field existed — the login password, the
  hours-table search, and a superseded login variant — and they disagreed on both border
  token and ring trigger.
- **This fixed a real contrast bug, not just duplication.** The search field was
  `border-line`, a hairline that does not clear the 3:1 a control boundary needs. Unifying
  on `border-line-strong` corrected it.
- `PasswordField` composes `Field` and owns its own visibility state — no
  `useLoginForm` hook, because `useActionState` is already the state machine and a wrapper
  around it plus one boolean removes no decision. `login-form.tsx` went from ~100 lines to
  ~45, holding only the server-action binding.
- The migration also let the search icon become a flex child rather than an absolutely
  positioned one with `pl-9` clearing it.
- **Visible side effect:** the hours-table filter label moved from mono uppercase
  micro-caps to sentence case, since `Field` has one label treatment. Mono marks data;
  a label is prose.

### 2026-08-10 — A photograph behind the hero

`public/hero.png` — the region the data describes, seen from orbit — now sits behind the
hero band.

- **Through `next/image`, not a CSS background.** The source is a 2.7 MB PNG; the served
  variants are **28 KB at 640w and 196 KB at 1920w**, measured against the running server.
  `priority` because it is the LCP element, which also emits the preload.
- **The scrim was measured, not estimated.** Sampling the asset, the brightest pixel under
  the text area is pure white — the true worst case. Over `--surface-inverse` at the
  gradient's 75% floor that leaves `--fg-inverse` at 8.45:1 and `--fg-inverse-muted` at
  5.18:1; at 80%, 10.18:1 and 6.24:1. The muted paragraph fails first and has 0.68 in hand
  at the floor, so the gradient must not be lightened without re-measuring.
- `isolate` on the band, since the image and scrim sit at `-z-10` and would otherwise drop
  behind the page background. `bg-surface-inverse` remains underneath as the fallback.
- `bg-linear-to-r`, not the v3 `bg-gradient-to-r` — this is Tailwind 4 and the old name
  emits nothing. Verified against the compiled stylesheet.

### 2026-08-11 — The loading skeletons had drifted from the shell

Both `loading.tsx` files hand-copy the dashboard shell — unavoidably, since the rail and
header read `searchParams` and a loading file receives none. A copy drifts, and these had.

- **Neither reserved the rail's logout row**, and neither gave the nav `flex-1`. So the
  foot of the rail arrived somewhere it had not been reserved, and the rail's bottom
  section appeared from nothing.
- **Neither header was `sticky top-0 z-30`**, though both real ones are — a non-sticky
  placeholder resolving into a sticky bar shifts the page under a reader already scrolling.
- **`/dashboard` omitted `ScopeLine` entirely**, so an element appeared mid-header on
  arrival, and stood one block in for the note *and* the date chip.
- **`/dashboard/hours` reserved a 32px circle** where `DataNote` is a labelled pill from
  `sm` — visibly wider on arrival.

Fixed by extracting `RailSkeleton` / `HeaderSkeleton` / `DataNoteSkeleton` into
`_components/shell-skeleton.tsx`, so the two routes share one copy instead of two. The
date chip now reuses `DateChipPlaceholder`, the real placeholder the header already uses,
so that footprint cannot be wrong by construction.

Rail row counts are **derived** — `WEATHER_METRIC_IDS.length` and a `RAIL_VIEW_COUNT`
exported beside the list it counts — where they were the literal `[3, 3]`. A fourth metric
would have left the skeleton a row short with nothing to catch it.

`shell-skeleton.test.tsx` compares the copy against `RailContent` itself: same row count,
logout row present, nav able to grow, same width/height/breakpoint. Three of its five tests
fail against the previous version.

### 2026-08-11 — Logout did nothing in production

Reported as "logged out but I can still reach the dashboard". It was real, it was
production-only, and no test covered it.

**Cause.** `destroySession` used `cookies().delete(name)`. Next implements that as
`set({ name, value: "", expires: epoch })` with *no other options*, and its
`normalizeCookie` adds only `path: "/"` — so the emitted header carried no `Secure`. The
production cookie is `__Host-` prefixed, and the browser refuses **any** `Set-Cookie` for
a `__Host-` name that lacks `Secure`. The deletion was discarded and the session survived.
Development never showed it: the name is unprefixed there, so the same header is accepted.

Captured against a real `next start`, before and after:

```
BEFORE  Set-Cookie: __Host-ea_session=; Path=/; Expires=<epoch>
AFTER   Set-Cookie: __Host-ea_session=; Path=/; Expires=<epoch>; Max-Age=0; Secure; HttpOnly; SameSite=lax
```

**Fix.** One `SESSION_COOKIE_OPTIONS` shared by both writes, and logout overwrites with an
expired cookie rather than calling `delete()`. The bug existed because create and destroy
were written independently and drifted; they cannot now.

**What was *not* broken**, checked first rather than assumed: the proxy, the per-route
`hasValidSession` checks, and the token itself. `/dashboard` and `/dashboard/hours` both
307 to `/login` with no cookie, verified against the production build.

**Coverage.** `session.ts` had no test at all — `session-token.test.ts` proved the token
and stopped there. New `session.test.ts` asserts that clearing replays every security
attribute the write used, and that the `__Host-` prefix and `secure` move together. Four
of its five tests fail against the old implementation, which is the point.

### 2026-08-10 — The landing page ends on the metric cards

Both sections that followed them are gone: the closing CTA band earlier, and now the "How
it's built" strip. What remains is header, hero, three metric cards, footer.

- The hero's secondary link points at `#how-it-works`, which is the **metric cards**
  section, not the removed one — checked before deleting, so the anchor still resolves.
- The hero preview card was trimmed to the two figures the chart cannot do without. The
  hour had a stat column while the crosshair chip stated it again; the footer legend named
  both series a third time. The legend's one unique fact — which colour is which line —
  moved onto the stat labels rather than being lost with the row.

### 2026-08-10 — Landing page accessibility pass

A static audit of the served markup — heading order, landmarks, link text, `aria-hidden`
coverage, `lang`. Heading order is clean (h1 → h2 → h3s → h2 → h3s), there are no
icon-only or empty links, and the arrow SVGs flagged as unhidden turned out to sit inside
`aria-hidden` parents, so they were already correct.

- **Every `nb-NO` figure now carries `lang`** (WCAG 2.2 §3.1.2). The document is English
  while every number is Norwegian-formatted, so an English screen reader voiced `1,024` as
  *one thousand and twenty-four* when the value is 1.024 NOK/kWh. The metric card's stat
  line had to be rebuilt from parts to do this: the words between the figures — "peak",
  "of", "hours" — stay English, so a single `lang` on the paragraph would have been wrong
  in the other direction.
- **The two content sections are named** with `aria-labelledby`. A `<section>` is only a
  navigable `region` once it has an accessible name; unnamed it is generic and landmark
  navigation skips it. The hero is deliberately left unnamed — a region wrapping the `h1`
  immediately inside `main` is redundant and adds noise.
- **Fixed a count I had formatted in the wrong locale.** "How it's built" said `1,440`
  hours, an English thousands comma on a page where `0,564` means nought-point-five-six-
  four. `formatCount` groups with a space for exactly this reason; the copy now matches.
- **Deleted `hero-visual.tsx`** — 237 lines unreferenced since `HeroPreview` replaced it,
  and still documented in `ui-registry.md` as though it were live. The entry is marked
  removed and keeps the three things worth knowing from it.

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
  password or how to obtain one — anyone opening the link hit a password field and
  stopped. `/login` now prints it, gated on a **new `DEMO_PASSWORD_HINT` variable**. It is
  deliberately not `DASHBOARD_PASSWORD`: publishing a credential must be an explicit act,
  and reading the real variable would mean any deployment published its password by not
  knowing the feature existed. Unset renders nothing.
- **Open Graph, with a generated image.** `metadataBase` resolves from `SITE_URL` or
  Vercel's production URL; `opengraph-image.tsx` draws the example day's real prices as
  1200×630 bars. Verified by fetching the route — 61 KB PNG, correct dimensions.
  `robots` is `noindex` at the layout and re-enabled only on `/`, since the dashboard and
  login have nothing to offer a crawler.
- **"How it's built"** — four decisions checkable against the repository, between the
  metric cards and the closing band. *Removed later the same day; the landing page now
  ends on the metric cards.*
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

Both items left open here — the dead `hero-visual.tsx` and the `lang` mismatch — were
taken in the accessibility pass above.

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

Second scope expansion: the goal shifted from domain depth to *handling volume well*.

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
- **`DEMO_PASSWORD_HINT` must be set on the deployment**, or the login page discloses
  nothing and a first-time visitor is stuck again. It is in `.env.example` and `.env.local`;
  Vercel needs it added separately.
- **`SITE_URL` is unset**, so `metadataBase` falls back to Vercel's production URL and,
  locally, to `http://localhost:3000`. Set it if a custom domain is used.
- **The OG image duplicates six colour values** as literals, behind a narrow lint
  exemption — Satori has no stylesheet for `var()` to resolve against. They will not
  follow `globals.css`; re-check them when a colour moves.
- **No `robots.ts` / `sitemap.ts`.** Per-page `robots` metadata covers indexing for now.
- ~~**`<html lang="en">` over `nb-NO` numbers — the dashboard half.**~~ **Resolved
  2026-08-14** by switching `APP_LOCALE` to `en-GB` rather than by marking up the
  dashboard's figures. The mismatch was the bug; once the numbers are English in an
  English document there is nothing left to annotate, and the `lang` scaffolding the
  landing page carried does not have to be rebuilt across the KPI cards, chart tooltips
  and hours table.
- All of Phase 6.

---

## Known risks

- **The chart has no hue to fall back on.** It is two tones of navy since 2026-08-14, so
  the solid-vs-dashed distinction — plus the separate axis, the differing units and the
  text legend — is the whole of what satisfies "never rely on colour alone." Do not
  simplify the line styles. This was already a risk when the palette had four hues at
  near-identical luminance; removing hue removed the redundancy, not the requirement.
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
