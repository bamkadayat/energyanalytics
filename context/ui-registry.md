# UI Registry

The record of visual patterns already in use, so every component built after the first
one matches it. Read this **before building any component**; add to it after.

Token values live in `ui-tokens.md`, the rules for applying them in `ui-rules.md`. This
file is the middle layer: the concrete decisions those rules produced.

If a new component needs a pattern that is not here, prefer extending an existing entry
over inventing a parallel one. If it genuinely needs something new, add it here in the
same commit — an unrecorded pattern is how drift starts.

---

## Established conventions

Extracted from the components below. These are the defaults; deviate only with a reason.

| Decision | Value | Notes |
| --- | --- | --- |
| Panel corner | `rounded-card` | cards, banners, panels |
| Control corner | `rounded-control` | buttons, inputs, toggles |
| Panel padding | `p-4` | |
| Icon ↔ text gap | `gap-3` | |
| Stacked text gap | `gap-1` | title and detail within a block |
| Icon size | `h-5 w-5` | with `shrink-0` and `mt-0.5` for optical alignment |
| Icon stroke | `currentColor`, `strokeWidth 1.75` | inherits the text colour of its container |
| Detail text | `text-sm` | secondary to a `font-medium` title |
| Border | 1px, a `*-line` token | never a shadow for flat separation |
| Card heading | `text-base font-semibold` | section heading one step up: `text-lg font-semibold` |
| Colour | data only | series, swatches and the heatmap ramp. Chrome is navy/slate — a coloured fill on a card, pill, bar or banner has to be encoding something the words do not |

**Never interpolate a class name.** `bg-${tone}-surface` produces no CSS, because
Tailwind scans for whole strings — and with the default palette cleared it fails
*silently* rather than falling back to something visible. Map tone → full class string.

---

## `StatusMessage`

`src/shared/ui/status-message.tsx` — the app's single way of stating the state of the
data. Every status in the interface goes through it; no bespoke banners.

**Tones:** `info` · `success` · `warning` · `error` · `neutral`, each mapped to its
status token trio (`*-surface` / `*-line` / `*-fg`); `neutral` uses
`surface-subtle` / `line` / `fg-secondary`.

**Three redundant signals.** Colour, icon *shape*, and text each carry the tone
independently:

- colour — the status token trio
- shape — a distinct icon per tone, never one glyph re-tinted
- text — an `sr-only` prefix (`"Warning:"`) plus the title itself

That redundancy is what satisfies "never rely on colour alone". Tests assert all five
tones produce distinct labels *and* distinct icon shapes, so collapsing two signals into
one fails the suite.

**Anatomy**

```
┌─────────────────────────────────────────────┐
│ (icon)  Title (font-medium)                 │   rounded-card, border, p-4
│         Detail text (text-sm)               │   icon gap-3, text gap-1
│         [action]                            │   action mt-2
└─────────────────────────────────────────────┘
```

**Accessibility contract**

- icon is `aria-hidden` — the text already says it
- not a live region by default; `live` opts into `role="status"` + `aria-live="polite"`.
  A live region firing on every server render is noise, not help
- `action` is for retry only where retrying can actually help

**Domain mapping** — the component is domain-agnostic; callers choose the tone:

| App state | Tone |
| --- | --- |
| Tomorrow's prices not published yet | `warning` |
| Partial data (one source failed, or dropped hours) | `warning` |
| Stale data | `warning` |
| Provider or network error | `error` |
| Non-causation qualifier, provenance, freshness | `info` |
| No data for the selected day | `neutral` |

---

## Buttons

`src/shared/ui/button.tsx` — the **only** place button styling is written. Import
`Button` for `<button>`, or `buttonClasses()` for a `<Link>` or `<a>`; never write the
classes inline.

`buttonClasses` returns a string rather than the component wrapping everything, because
these styles apply to three elements — `<button>`, Next's `<Link>`, and a plain `<a>` —
and a component per element would be the same rule copied three times.

| Variant | Use |
| --- | --- |
| `primary` | the main action (sign in) |
| `secondary` | supporting action on a light surface |
| `outline` | low-emphasis action (sign out, retry) |
| `inverse` | on `--surface-inverse` — a white pill against navy |
| `ghost-inverse` | the *second* action on `--surface-inverse`, beside an `inverse` pill |

| Size | Padding | Use |
| --- | --- | --- |
| `sm` | `px-3 py-1.5 text-sm` | inline actions inside banners and headers |
| `md` | `px-4 py-2 text-sm` | default |
| `lg` | `px-7 py-3 text-base` | the hero call to action |

**Width comes from content, never from a fixed size.** Where a button needs more
presence — the hero call to action against a 4.5rem headline — add a responsive
*minimum* (`sm:min-w-48`), not a width. A fixed width clips a longer label, and this
button's label changes with the session ("Login" versus "Go to dashboard"). Leave the
minimum off below `sm`, where it would span most of the viewport and read as a
full-width bar.

**Hover and focus share one ring.** `.btn-ring` in `globals.css` draws an `outline` at
`outline-offset: 3px`, and each variant sets `--btn-ring-color`.

`outline` rather than a border or box-shadow: it sits outside the box and makes its own
transparent gap, so nothing reflows on hover and no rule needs to know what colour the
surrounding surface is. It is declared transparent up front so the colour transitions
rather than snapping.

The same declaration serves `:focus-visible`, which fixed a real bug — the global focus
ring is `--focus` (near-black navy) and was **invisible** against the navy hero. Any
variant that sets `--btn-ring-color` now gets a visible focus ring on its own surface.

The `inverse` variant also inverts its fill on hover (navy fill, white text). Its ring is
white, and a white ring around a white pill on navy would be invisible.

**Two filled pills side by side have no hierarchy** — that is what `ghost-inverse` is
for. It carries `inset-ring-line-inverse-strong`, brightening to `--fg-inverse` on hover.
The hairline `--line-inverse` is too faint for a control boundary: `--line-inverse-strong`
is the token that clears 3:1. An *inset ring* rather than a `border`, unlike the `outline`
variant, because this one stands next to a filled pill and a border would make it 2px
taller than its neighbour.

> `ghost-inverse` currently has **no callers**. Its only one was the hero's secondary
> action, which became a text link with an arrow — even as a ghost, a second pill read as
> a peer of the primary. The variant is kept, defined and tested for the next
> two-actions-on-navy case; delete it if none arrives.

**Every variant is `rounded-pill`**, and a test asserts it — buttons had previously
drifted between `rounded-pill` and `rounded-control` because each was styled at its call
site. Every variant also carries a `disabled:` treatment, so a disabled button never
still looks pressable.

---

## Logo mark and wordmark

`src/shared/ui/logo-mark.tsx` — two wind gusts above a rising measurement line ending in
a data point. Moving air, read as a series.

- **Inline SVG on `currentColor`**, not an image file. It needs no request, scales
  without blurring, and takes the colour of whatever it sits in — which is what removed
  the white badge the previous PNG needed on the navy hero
- three strokes and one dot, deliberately. Anything more disappears at 36px, the size it
  is used at almost everywhere
- `viewBox 0 0 24 24`, `strokeWidth 2`, round caps and joins
- `Wordmark` sets colour once on the wrapper and both mark and text inherit, so there is
  one `tone` switch rather than an asset per background
- **`short` drops "Nordic" from the *visible* name only** — the full name stays in an
  `sr-only` span, because an abbreviation that is only ever spoken as the abbreviation is
  how a product ends up with two names. Used by the dashboard rail, where the full name
  wraps at 240px, and by the **landing navbar**, where the shorter lockup sits better
  against the "Log in" link opposite it. The footer keeps the full name, which is where a
  visitor looks for what the product is actually called
- `src/app/icon.svg` is the same drawing with the navy pinned, since a favicon has no
  inherited colour to take

---

## The range section ("The last N days")

`range-views.tsx` — the summary line above the two range cards, and the wording both
cards depend on.

Both multi-column card grids keep **equal-height columns**, and the chart *grows into*
the row rather than the card padding the difference with empty white: `ViewCard`'s chart
slot is `flex-1` over a per-card `chartMinHeight` (the heatmap passes the taller
`--chart-heatmap-height`, since it has 24 rows to fit), and every chart is
`height: 100%`. `items-start` is the other way to remove that white space, and it was
tried first — it leaves a ragged bottom edge and a chart no bigger than its minimum.

- the summary is **three sentences, one fact each**: how much data, the median, then the
  two tails. It was one sentence carrying all four, with "at or above" and "at or below"
  a few words apart
- the duration curve's x-axis name is a **finished sentence** — "Share of hours at or
  above this price". Cut short at "at or above", it left the reader to guess above what,
  which is the whole trick of a duration curve
- `deriveDurationCurve` returns **`expensiveTenth` / `cheapestTenth`**, not `p10` / `p90`.
  The array is sorted *descending*, so the value at 10 % is the dear end — the percentile
  names read as the exact opposite of what they hold
- **`grid.top` is 36 on every chart.** An axis name sits *above* its axis, outside the
  grid, so anything under about 32 clips it against the top of the card — it happened on
  the hourly chart, then again on both range charts
- the first card is **"What each hour costs"** — a boxplot, one box per hour of the day.
  It replaced a heatmap of the same data: a heatmap encodes price as colour intensity on
  a fixed scale, and this market's regular near-zero hours stretched that scale until
  every ordinary hour sat in the same two shades of blue. A boxplot encodes the numbers as
  *position*, which has no such ceiling, and adds what the grid could not show — the
  spread. Two hours can share a median and be nothing alike
- the trade is stated rather than hidden: the heatmap could say *which day* an extreme
  fell on and the boxplot cannot. That question belongs to the duration curve and the
  table
- its tooltip **names each figure** (median, middle half, range) instead of listing five
  bare numbers, and the table adds the **day count** behind each box — a box drawn from
  three days and one drawn from thirty look identical on a canvas
- the curve card is titled **"Hours sorted by price"**. "Price duration curve" is precise
  to an energy analyst and opaque to everyone else; the domain term sits in the caption,
  where it can be looked up rather than decoded
- **the tooltip is a sentence** — "25% of hours cost 1,02 NOK/kWh or more". The default
  pairing of an axis value and a number reads as a price *at* 25 % of something, which is
  the one thing the axis is not
- **the median is drawn on the chart**, dashed in `--chart-crosshair` with its value in
  the label. A sorted curve has no landmarks of its own — no dates, no peaks in time — so
  there is nothing to judge high or low against until one is given

---

## Segmented link controls

`src/features/market-correlation/components/view-controls.tsx` — day and metric
selectors.

**`scroll={false}` on every one of them.** Next's default is to keep the scroll position
only while the Page element is still in the viewport; below that it scrolls to the top of
it. A filter sitting far down the page — the range presets under the 30-day views — would
therefore throw the reader back to the header on every press. These links change what is
rendered in place, they are not destinations. The `#day-view` / range anchors in the rail
keep the default, because moving the page is what they are for.

**Links, not buttons.** The selection *is* the URL, so navigating is the whole
interaction: they work before JavaScript loads and keep the back button meaningful. No
`"use client"` boundary anywhere in the control.

- group: `rounded-pill border border-line bg-surface p-1`, items `gap-1`
- item: `rounded-pill px-4 py-1.5 text-sm`
- selected: `bg-surface-selected border-line-selected text-on-action-secondary`,
  `font-medium`, plus `aria-current="page"`
- unselected: `border-surface` — a border of the same width in the container's own
  colour, so selecting an option cannot shift the layout
- label above each group: `font-mono text-xs uppercase tracking-wider text-fg-muted`

Selection is carried by border, background **and** `aria-current` — never colour alone.

---

## Page furniture

**Masthead** — `text-display font-semibold` title, then a `font-mono text-sm
text-fg-muted` meta line joining price area · weather location · timezone with `·`.
Those three facts are the caveats the page must never bury, so the structure states them
rather than decorating.

**Mono for data.** Geist Mono is used for times, dates, numbers and provenance; Geist
Sans for prose. Within a fixed single-family token system this is the one typographic
distinction available, and it earns its place by marking which text is instrument
readout and which is explanation.

**Provenance footer — removed** (2026-08-10, on request). Two lines under the day view
naming each source and when it was retrieved. The sources are still credited in the
landing page footer; what went with it is the *freshness* signal, so nothing on the
dashboard now says how old the numbers are. `cacheLife("hours")` makes that gap real —
see the stale-data row in `ui-rules.md`'s state table, still unimplemented.

**Loading region** — states what is being waited for rather than spinning, sized with
`min-h-[var(--chart-min-height)]` so the page does not jump, and marked `aria-busy`.

**Landmarks** — `<header>` for the banner, then **one `<main>` wrapping every content
section**, then `<footer>`. `layout.tsx` provides none of these, so each page owns them.
Putting `<main>` on the first section instead of around all of them leaves the rest of
the page outside every landmark, where "skip to content" and landmark navigation cannot
reach it — that is exactly what the landing page did until it was fixed.

---

## Summary card

`components/summary-cards.tsx` — a `<dl>` grid, `sm:grid-cols-2 lg:grid-cols-3`, gap-3.

- card: `rounded-card border border-line bg-surface p-4`, contents `gap-1`
- term (`<dt>`): `font-mono text-xs uppercase tracking-wider text-fg-muted`
- value (`<dd>`): `font-mono text-2xl font-semibold text-fg`, unit beside it at
  `text-sm text-fg-muted`
- optional note: `text-xs text-fg-muted`

**The unit is suppressed when the value is missing**, so a card never reads
`— NOK/kWh`. When a card cannot apply at all (the current hour, while viewing tomorrow)
it says so in the note rather than showing a bare dash that looks like a data failure.

## Chart container

`figure` wrapper: `rounded-card border border-line bg-surface p-4`, `gap-3`, with a
`<figcaption>` at `text-sm text-fg-muted` naming both series, their axis sides and the
date. The caption is what makes the dual axes legible to someone who cannot see the
line styles.

## Observations list

`components/insights-list.tsx` — plain restatements, never inferences. Every sentence is
something a reader could verify from the table.

- the hour lives in a **mono chip in its own column**, not at the head of the sentence.
  That is what makes the list scannable: the times line up, so "when" is answered by
  running an eye down the left edge, and each sentence is free to start with its subject
- rows are separated by **hairlines** (`divide-y divide-line`), not boxed individually —
  four boxes read as four cards
- each extreme is stated **against the daily average**, and that clause is dropped rather
  than hedged when there is no average to compare to
- causal vocabulary is forbidden, and a test fails on it

## Dashboard shell

`app/dashboard/page.tsx` + `app/dashboard/_components/sidebar.tsx` — a rail and a
full-width work area, which is the layout that reads as an application rather than a page.

- the rail is **dark** (`bg-surface-rail`, navy-900) against a light work area. Not
  decoration: it separates chrome from content without a heavier border, and it carries
  the same ink the landing page's bento cards use, so the two halves look like one product
- **sidebar** (`w-60`, sticky, full height) carries the brand, the filters and Logout.
  Every entry is a **real filter or a real anchor** — a rail of dead links looks like a
  dashboard and behaves like a mock-up
- items are `rounded-control px-3 py-2`; active is a **fill, an inset ring and a weight
  change** (`bg-surface-rail-active inset-ring-line-inverse-strong font-medium`) plus
  `aria-current`. The fill alone would be colour carrying meaning on its own, and it is
  only 1.19:1 against the rail — it was also the hover fill, so an unselected row under
  the cursor looked selected. The ring (3.3:1) is what makes selection visible; hover
  stays the fill alone
- **metrics carry a colour swatch, not an icon.** A thermometer beside "Temperature"
  repeats the word; the swatch says what the label cannot — which line in the chart this
  is. Unit chips sit on the right (`border-line-inverse-strong`)
- badges are live data (the loaded range), not decoration
- Logout is pinned to the bottom behind a divider: used once a session, so it does not
  deserve space next to the data
- **no search field.** The reference has one, but this app has a single dataset and
  nothing to search; a box that accepts typing and does nothing is a worse lie than an
  absent feature
- hidden below `lg`, where `MobileNav`'s `<dialog>` drawer renders the **same**
  `RailContent`, on the same dark ground. A fixed rail on a phone costs more width than
  the charts can spare
- the work area is **full width** with `px-4 sm:px-6`, not a centred `max-w-content`
  column. Centring is what made it read as a document
- charts sit in a **grid**: the day chart takes 2fr against 1fr of observations at `xl`,
  and the two range charts split at `2xl`
- sections carry `scroll-mt-24` so the sticky header does not cover a heading the rail
  anchors jump to

## Dashboard header

`app/dashboard/_components/header-controls.tsx` — a **command bar**, not a title bar.

- carries the **day switch, once.** It used to exist twice, in the rail and above the
  chart, for one piece of state: two places to look when the wrong day is showing, and two
  things to keep in sync
- a segmented pill of **links** (`bg-surface-subtle` track, `bg-surface shadow-card` on the
  selected one) with `aria-current` — a chosen day is shareable and the back button steps
  through previous ones
- `ScopeLine` states the price area and the weather point beside it. Two caveats this page
  must never bury, so they sit next to the control rather than in a footnote
- `DateChip` resolves "today" to an **absolute date**, right-aligned. It is `async` because
  resolving it reads the clock, so it renders behind its own `<Suspense>` with a
  same-footprint placeholder rather than making the whole header request-time
- the chip is **read-only text, not a picker.** This app derives its span from the preset,
  so a button opening nothing would be a dead control
- the `h1` is `sr-only`: the rail carries the product name, but the heading outline still
  needs a root

## KPI strip

`summary-cards.tsx` — one large card and four small, not six equal ones.

- **`PriceNowCard`** takes the left column: the current price at `text-4xl/5xl`, a signed
  delta pill against the daily average, and `PriceStrip` under it. The three belong
  together — a price means nothing without the average, and the average means nothing
  without the shape of the day. Six equal cards made the reader decide what mattered
- the delta pill **carries its own sign** (`+` / `−`) rather than leaving the fill to say
  it: a red 47 % could mean either direction, and this is the figure most likely to be
  acted on. Because the sign carries it, the pill itself is **neutral**
  (`bg-surface-subtle`)
- the four compact cards stay `p-3` with a `text-xl tabular-nums` value and a
  `text-[0.6875rem]` uppercase label, in a **2×2 grid at every width**. A single row would
  stretch each to the tall card's height and leave two thirds of it empty
- **all four cards are identical.** Cheapest and priciest used to carry a coloured left
  border in `--price-low` / `--price-high`; that made two of the four look like a
  different component and spent the loudest colours on the page saying what the terms
  "Cheapest hour" and "Priciest hour" already say. A KPI strip reads as a strip when its
  cards match
- **`price-strip.tsx`** draws one bar per hour, scaled **from zero** — a floor at the day's
  minimum would redraw a flat day as a dramatic one. **Only the current hour is picked
  out.** Filling the cheapest bar green and the priciest red put the two loudest colours
  on the page inside a sparkline the width of a paragraph, and said nothing the bars did
  not: the cheapest hour is the shortest bar and the priciest the tallest, by
  construction. Height cannot show *where you are*, so that is the one hour with a fill; a missing hour keeps its slot as a 2px sliver rather than letting
  the bars close ranks. `aria-hidden`, because every figure in it is already text elsewhere

## Cheapest window card

`cheapest-window-card.tsx` — the cheapest run of **consecutive** hours (3), and the join's
coverage under it.

- the only figure on the page that is a **decision rather than a reading** ("when should I
  start the machine"), which is why it gets a card instead of a list row
- a window containing an hour without a price is **skipped, not averaged over what it
  has** — "cheapest three hours" made from two would be a different claim, quietly
- the coverage bar states how many hours carry **both** series. That sentence is what
  satisfies "the chart is never the only way to read the result"; the bar is
  `aria-hidden` illustration of it

## Range dropdown

`components/range-select.tsx` — how many days the range views cover (7 / 14 / 30 / 60).

- a **native `<select>`**, styled with tokens, not a custom listbox. A bespoke dropdown
  means re-implementing roving focus, type-ahead, `aria-activedescendant` and the mobile
  picker; getting one of those wrong is worse than the stock control looking less bespoke
- unlike the chart/table toggles this one **does navigate** — a different range is
  different data, which only the server can fetch. `router.replace(..., { scroll: false })`
  keeps the position, and `useTransition` keeps the old numbers on screen while the new
  ones load rather than collapsing the section into a skeleton
- an unknown value falls back to 30, like every other parameter. `?range=1000` would
  otherwise fire a thousand price requests
- capped at 60 days: the price API is one request per day, so a 90-day option would fire
  90 parallel requests at one host on a cold cache

## Chart card with view toggle

`components/view-card.tsx` — wraps every chart section: title and series legend on the
left, a chart/table toggle on the right, content, then a caption.

- **one toggle per card, not one for the page.** Each view answers a different question,
  and someone reading the duration curve as numbers should not have their heatmap switch
  underneath them
- **both views are rendered on the server and passed in as props**, so switching is
  instant: no request, no page re-render, no Suspense fallback flashing, no scroll jump.
  Server components can be children of a client component, which is what makes this work
- the URL still tracks each mode, but through `history.replaceState` rather than a
  navigation — shareable and correct on a fresh load, without a round trip for data the
  page already has
- `<button aria-pressed>`, **not links**, because nothing navigates. A link that goes
  nowhere lies to anyone using a keyboard or a screen reader
- the toggle is **worded** ("Chart" / "Table") in a segmented pill matching the header's
  day switch, with an `aria-label` carrying the fuller description. The icon-only version
  it replaces made the reader decode a glyph to find the numbers
- selection carries a fill **and** a weight change plus `aria-pressed`, never colour alone
- **a full-screen toggle** in the header, on every card. It earns its place on the wide
  views: the heatmap is 24 rows across 30 day columns, and its table is the same grid in
  numbers — neither fits a card in a two-column grid without scrolling the page. Expanded,
  the section is `fixed inset-0 z-50`, the body scrolls and the page behind it is locked
- **not a `<dialog>`.** Focus is not trapped and nothing behind is inert, so `aria-modal`
  would be a lie to a screen reader. It is a panel that fills the window: `aria-pressed`
  reports the state and Escape closes it
- expanding **dispatches a window resize**. ECharts sizes its canvas once and then listens
  for window resizes, so a container that grows without the window growing leaves the
  chart drawn at its old size inside a much larger box
- the caption under the body is **optional** (`chartCaption?`). The day chart's axes are
  already named with their units on the canvas and keyed by the legend in the header, so
  a sentence repeating them was a third statement of the same thing
- the chart slot is `relative flex-1` with a `min-height`, and the chart itself sits in an
  `absolute inset-0` box. That is load-bearing: ECharts fills `height: 100%`, and a
  percentage height resolves against the parent's *height*, never its `min-height` — so in
  any layout where the card is not stretched by a grid row, the chart resolved to zero and
  collapsed to a sliver of overlapping axis labels
- **chart and table share one ground** (paper). The chart sat on ink for a while, on the
  argument that thin coloured lines separate better against dark — they do, but it made a
  single panel a different surface from every card around it, and swapping a card's
  background on a Chart/Table press reads as navigating rather than toggling. The series
  clear 3:1 on paper too, and the light chrome tokens are the tuned ones: on ink the grid
  was `--chart-grid-inverse` at **1.19:1**, a gridline nobody could see
- **`series-legend.tsx`** puts the key in the DOM rather than on the canvas, where it is
  selectable, readable by assistive technology, and survives the chart failing to mount.
  Its swatches are **line samples, solid and dashed**, so the legend teaches the
  distinction ui-tokens.md calls load-bearing. ECharts' own legend is off: two keys inches
  apart is one too many
- in chart mode the day's table renders **inside the chart branch** as a disclosure, so
  it follows the live mode rather than a stale server param. The canvas is opaque to
  assistive technology, so the numbers must not depend on noticing the toggle

Tabular forms live in `range-tables.tsx`. The heatmap's table is the same grid in text —
day rows, hour columns, sticky headers. The duration curve's is **deciles, not 720 sorted
rows**: the raw list would answer no question anyone asks, while ten lines answer the one
the curve exists for.

## Hourly data table

`components/hourly-table.tsx` — the accessible alternative to the canvas, and required
rather than optional.

- Built on `<details>`/`<summary>`, so the disclosure is keyboard operable with **no
  JavaScript and no client component**
- `FiChevronRight` rotated by `group-open:rotate-90`, `aria-hidden`
- `<caption>` states the day, the timezone, and that `—` means *no reading*, not zero
- Hours are `<th scope="row">` so each cell is announced with its hour; column headers
  are `<th scope="col">`
- Numeric cells: `text-right font-mono tabular-nums` so decimal points line up
- Wrapped in `overflow-x-auto` so the table scrolls rather than the page
- **eight rows, then "Show 8 more"** (and "Show fewer" once expanded), with a
  `Showing 8 of 24 hours` count in `aria-live`. Twenty-four hours is not something anyone
  pages through, so it is one control and a count rather than page numbers. Eight is
  chosen to land the table at roughly the chart's height: pressing Chart/Table should
  change what the card shows, not how much room it takes
- **sorting runs over every hour, then the list is cut.** Sorting the visible slice would
  answer "the cheapest of the eight you happen to be looking at"
- **superseded:** `hourly-table.tsx` rendered a `<details>` disclosure under the day
  chart, so the numbers were reachable without pressing anything. It was removed on
  request — the Chart/Table toggle already reaches the same table, and the disclosure
  duplicated it. The component is now unreferenced. The consequence to know: the toggle
  is a `<button>`, so with JavaScript off the chart is the only representation. Making
  the toggle a link on `?view=table` would restore the no-JS route, since the server
  already renders from that param

## Skeletons

`shared/ui/skeleton.tsx` — `Skeleton` (one block) and `SkeletonRegion` (the wrapper that
owns the announcement). `market-correlation/components/skeletons.tsx` composes them into
`DayViewSkeleton`, `RangeViewsSkeleton` and `HoursTableSkeleton`.

- **A skeleton mirrors the layout it stands in for** — same grid template, same card
  count, same proportions. Three bars of unequal width in a tall empty card is not a
  loading state, it is a broken one, and it costs a visible reflow when the data lands
- one grey, one radius, one pulse, from the primitive. Skeletons had been written at each
  call site, which is how they drifted
- **blocks are `aria-hidden`; the region owns a single `role="status"`** with an `sr-only`
  label. A dozen empty boxes announced one by one is worse than silence
- the label names *what* is being waited for. The dashboard's two waits differ by an order
  of magnitude — today's day view against ninety cached price requests — and knowing which
  one you are in is the point
- **the pulse stops under `prefers-reduced-motion`.** A loading state is exactly when
  someone sensitive to motion is already waiting and watching the screen
- `loading.tsx` files mirror the **shell** (rail, header, then the region skeletons), and
  `/dashboard/hours` needs **its own**: `loading.tsx` cascades, so without one a visitor
  navigating to the table would watch a KPI row and two charts resolve into a table

---

## The hours table (`/dashboard/hours`)

`hours-table.tsx` — every hour of the last 90 days (~2,160 rows) in one scrollable table,
reached from the rail's **All hours** entry.

- **Only the visible window is in the DOM** (`useVirtualizer`): roughly 25 rows mounted at
  any scroll position, whatever the page holds. The `tbody` is as tall as the whole page
  of rows and each drawn row is positioned into it, so the scrollbar describes the data
  rather than the mounted subset
- **sorting and filtering run over the whole set**, then the virtualizer draws what
  survives. Sorting a page would answer "the cheapest of the hundred you are looking at"
- **`aria-rowcount` on the table, `aria-rowindex` on every row.** Virtualization normally
  costs a screen-reader user the table — the rows are absent and the ones present misstate
  their position. These two attributes are what put the count and the position back
- the virtualized layout needs `display: grid` on the table elements, which **drops their
  implicit roles** in several browsers, so `role` is written on each one explicitly
- **the scroll container is focusable** (`tabIndex`). With the rows virtualized there is
  nothing inside to tab to, so without it there is no way to scroll without a pointer
- height is `--table-height`, a viewport clamp (`clamp(24rem, 68vh, 56rem)`) — the view is
  about the size of the dataset, so it takes the device's height rather than a fixed one.
  `SCROLLER_HEIGHT` in the component mirrors it as the pre-measurement estimate
- controls are a **search box, a "only hours with a price" checkbox and a page size**
  (100/500/1000), with `1–100 of 2,160 hours` in `aria-live`
- rows are **primitives from the server** — epoch milliseconds and a pre-formatted label,
  never `Date` objects. A few thousand `Intl` calls before the first paint is the cost of
  formatting on the client

---

## The data note

`src/app/dashboard/_components/data-note.tsx` — the standing qualifications (Oslo as a
representative point, exploratory not causal, prices exclude VAT and grid charges),
behind an info control in the page header.

- it was a full-width banner at the foot of the day view. Nothing about it changes
  between renders and none of it is news, so a banner spent the weight of an alert on a
  permanent footnote — but `ui-rules.md` still requires the non-causation statement
  wherever the data is shown, so it has to stay *reachable*
- **a button, not a `title` and not hover-only.** Hover text is unreachable on a
  touchscreen and awkward on a keyboard. This opens on click, Enter and Space, closes on
  Escape or a click outside, and reports state through `aria-expanded` /`aria-controls`
- the panel is a **sibling of the trigger** and `role="note"`, so a screen reader meets
  the text immediately after the control that announced it
- anchored under the trigger and right-aligned (`absolute right-0 top-full`), never
  floated to the middle of the screen; `w-screen max-w-sm` keeps it readable on a phone
- in the header it sits above every view it qualifies, which is nearer the chart than the
  foot of the page ever was

---

## Session call to action

`src/app/_components/session-cta.tsx` — used in the navbar (`size="sm"`), the hero and
the closing band (both `size="lg"`).

- signed out → `/login`; signed in → **Go to dashboard** (`/dashboard`).
  A control should say exactly what it does, and "Login" is a lie to someone already
  logged in
- **that rule binds in both directions.** The hero and closing band used to say **Open the
  dashboard** while signed out, on the argument that the button is the offer and login is
  merely the gate on the way to it. That was the same lie reversed — it promised a
  dashboard and delivered a password field
- **two labels, no label prop.** Signed out it is **Log in**; signed in, **Go to
  dashboard**. The label once varied by placement and no longer does: the control does the
  same thing in all three positions, and a control that reads differently in each spot
  only invites the three to drift apart again
- **`appearance` varies the presentation only** — never the label or the destination.
  `pill` for the hero and closing band, `text` for the navbar
- **the navbar is a text link, not a pill.** Even one size down it was the hero's control
  repeated in the same viewport, and two of those leave neither reading as the primary
  action. It is weighted to answer the wordmark across the bar (`text-base font-semibold
  sm:text-lg`, the wordmark's own scale) — dropping the pill cost it presence, and a nav
  link that recedes into the band is worse than the pill it replaced
- **the navbar link is not underlined at rest**, which `ui-rules.md` otherwise requires.
  The rule exists because `--link` is near-indistinguishable from body text by colour; this
  sits alone in the top-right of a `<header>`, opposite the wordmark, where position is the
  affordance and there is no body text to confuse it with. Underline arrives on hover
- **the `text` appearance overrides the focus ring** (`focus-visible:outline-fg-inverse`),
  since it sits on the navy band where the global `--focus` is invisible
- **one component for both placements**, so the navbar and the hero can never disagree
  about whether you are signed in
- `inverse` button variant, since both sit on `--surface-inverse`
- reading the session is request-time, so each mount sits in `<Suspense>`; the headline,
  subtitle and visual stay in the prerendered shell rather than the page going dynamic
  for two buttons
- the fallback reserves the footprint and shows **no label**. Rendering "Log in" and
  correcting it afterwards would flash the wrong word at the primary control on the page.
  Its *height* is exact; its **width can only approximate**, because the two labels differ
  in length and which one arrives is the thing being waited for — the `lg` callers pass
  `sm:w-48`, which fits the longer of the two. The `text` appearance reserves a **line box,
  not a pill**: a pill resolving into bare text is a worse flash than no placeholder

## Login card

`app/login/page.tsx` + `features/auth/components/login-form.tsx` — **white ground, navy
ink, no filled surface**, with the back link outside the card.

- **no dark panel.** This was a `bento` card on a tinted page: two stacked surfaces framing
  a form with one field. Structure now comes from a single hairline (`border-line`) and the
  field's own edge. The submit button is the only saturated element on the route, which is
  what makes it read as the action
- **`primary`, not `inverse`, on the button.** `inverse` is a white pill built for the dark
  card and would be white-on-white here
- **the focus ring needs no override.** `--focus` is the navy primary, so it is visible on
  white — the dark-surface version had to work around exactly that
- **the error message uses `--error-fg`.** On the navy card it was `--error-surface`, a
  *background* token pressed into service as text, which only passed because a pale pink
  happens to read on navy. Now it is the correct pairing rather than a lucky one
- **no decorative price curve.** It once carried one across the top; the login polish pass
  removed it — a real chart drawn too small to read, above a form with one field, costing a
  price fetch and 6rem of reserved padding
- wordmark, then a mono eyebrow naming the area and location, then the heading
- **no explanatory paragraph.** One used to state that there are no accounts. A labelled
  field and a button do not need a sentence describing them, and it was read past rather
  than read; the demo note carries what mattered
- the field is a bordered row owning its focus ring via `focus-within`; the input's own
  outline is suppressed so two rings do not nest
- **Show/Hide is a real toggle**: `aria-pressed` says which way it is set, the visible
  word says what pressing it does. Those are different questions and both get an answer
- source links sit inside the card behind a divider
- **the demo-password note is untinted.** It first used the `info` family, which put a pale
  blue block on a page with no other colour; the restraint pass had already removed exactly
  that from the dashboard's standing note. It is separated by a rule, like the sources
  beneath it, with the password boxed in `--line-strong` and `select-all` — a reviewer
  copies it rather than retyping, and a bare word in a sentence gives them nothing to aim
  at
- the note renders **only when `DEMO_PASSWORD_HINT` is set**, and that is deliberately a
  *second* variable rather than the real `DASHBOARD_PASSWORD`. Publishing a credential has
  to be an explicit act: reading the real one would mean any deployment published its
  password by not knowing the feature existed. See `shared/config/server.ts`
- **"Log in", not "Login"**, on the heading and the submit button — the same words as every
  CTA that leads here

**Only the controls that exist** — no email field, no "forgot password", no social login.
With one shared password none of them could do anything.

## Sign-in card (superseded)

`src/app/login/page.tsx` + `features/auth/components/login-form.tsx`.

- centred `max-w-md` card: `rounded-card border border-line bg-surface p-8 shadow-card`
- `size-14 rounded-card bg-surface-inverse` badge holding `FiLogIn`, above a `text-3xl`
  heading and a muted line
- field: `rounded-control border border-line bg-surface-subtle` with `FiLock` absolutely
  positioned and `pl-10` clearing it. The icon is `pointer-events-none`, so clicking it
  still focuses the input
- action is a full-width `Button size="lg"` — still `rounded-pill`, per the radius rule
- the label is `sr-only`, not removed. The reference relies on the placeholder alone, but
  a placeholder vanishes as soon as you type and is not a label to assistive technology

**Only the controls that exist.** No email field, no "forgot password", no social
sign-in: with a single shared password none of them could do anything, and a control that
cannot work is worse than a missing one.

## Error and empty screens

`app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/dashboard/loading.tsx`.

- all four are branded: wordmark, tokens, the shared `Button`. A default framework error
  page is the one screen users see when they are already frustrated
- copy explains and offers a way on. **Errors never apologise** and are never vague about
  what happened — the same rule as the in-page status banners
- `error.tsx` uses the **`retry`** prop, not `reset`. `retry()` re-fetches and re-renders;
  `reset()` only re-renders, which for a data-fetching failure shows the same error again.
  Stable since Next 16.3
- error screens surface `error.digest`, never `error.message`. Messages are scrubbed in
  production builds, and printing a raw one risks leaking internals for no benefit
- `global-error.tsx` renders its own `<html>`/`<body>` and **imports `globals.css`
  explicitly** — Next does not give it the app's styles automatically, and importing them
  is what avoids hard-coding colours past the token system
- `loading.tsx` mirrors the loaded layout — header, controls, cards, chart outline — so
  the page settles into shape instead of reflowing. One `role="status"` announcement for
  the screen; the skeleton itself is `aria-hidden`

Adding `dashboard/loading.tsx` also moved that route from fully dynamic to a partial
prerender, since the Suspense boundary lets Next ship a shell.

## Site footer

`src/app/_components/site-footer.tsx` — `border-t border-line bg-page`, wordmark and
source links on one row, small print below.

- this is where the data qualifications live on the public page: VAT and grid-charge
  exclusion, Oslo as a representative point rather than a regional average, and the
  non-causation statement. They read as small print here, which is what they are — the
  dashboard states them again beside the actual numbers
- source links are attribution, and required by `ui-rules.md`
- **no copyright year.** `new Date().getFullYear()` in a server component fails the build
  under Cache Components with `blocking-prerender-current-time`, and a year hard-coded
  today is wrong in January

## Closing call-to-action band

`src/app/_components/closing-cta.tsx` — a navy panel inset from the page edges, closing
the landing page.

- `rounded-card bg-surface-inverse` inside `max-w-content`, so it reads as a panel on the
  light section rather than a full-bleed band
- centred stack: `text-display` heading, `text-fg-inverse-muted` paragraph, then the same
  `SessionCta` used in the navbar and hero
- background texture is the **logo mark itself**, oversized and bled off both edges at
  `opacity-5`, one mirrored with `-scale-x-100`. At that opacity it reads as texture, not
  as the logo appearing three times on one page
- `animate-reveal`, like the cards above it

Three CTAs now share one page. They are all the same component with the same label, so
they cannot disagree about the session — but they are not interchangeable: the navbar is a
**text link**, while the hero and this band are **pills**. One page, one primary action.

## Open Graph image

`src/app/opengraph-image.tsx` — the link preview card, 1200×630.

- **real prices from `PREVIEW_DAY`**, the same fixed day as the hero. The landing page
  exists to be sent to someone, so the preview is part of the product; a generic gradient
  would be the one invented number on an otherwise sourced page
- **bars, not a line.** Satori lays out boxes and cannot stroke a path reliably
- **bars scale from zero**, not from the day's minimum. Scaling from the minimum turns a
  flat day into a dramatic one — a truncated axis on the image that represents the project
- **draws nothing when the provider is unreachable** at build time, rather than inventing
  a shape
- **it holds the only colour literals in `src/`**, behind a narrow `no-restricted-syntax`
  exemption. Satori rasterises without a stylesheet, so `var(--token)` has nothing to
  resolve against, and the guard's silent-failure rationale does not reach a file that
  emits no classes. **These values do not follow `globals.css`** — re-check the block at
  the top of that file whenever a colour moves
- `PREVIEW_DAY` is a constant, so nothing reads the clock and Next generates it once at
  build time

## Landing page motion

Two utilities in `globals.css`, both pure CSS — the landing page needs no client
JavaScript and stays prerendered.

- `.animate-enter` — on load. Set the stagger per element with
  `[--enter-delay:180ms]`. `animation-fill-mode: both` holds the start state through the
  delay, so nothing flashes before it begins
- `.animate-reveal` — on scroll, via `animation-timeline: view()`

**The scroll reveal is wrapped in `@supports (animation-timeline: view())`.** This is not
optional: the rule sets an invisible start state, so applying it where the timeline is
unsupported would leave content permanently blank. Outside the guard the element is
simply visible, which is what Firefox and older browsers get.

**Both are switched off explicitly under `prefers-reduced-motion`.** The base-layer rule
only shortens `animation-duration`, and a scroll-driven animation ignores duration
entirely — its progress comes from the timeline, not from time. Relying on the global
rule alone would leave the reveals fully active for users who asked for less motion.

Current stagger: header 0 → headline 90ms → subtitle 180ms → CTA 270ms → visual 340ms.

## Bento metric cards

`_components/metric-highlights.tsx` + `_components/spotlight-card.tsx`.

- **ink gradient inside a 1px gradient border**, `--radius-bento` (20px). Two backgrounds
  with different clip boxes — `padding-box` paints the fill, `border-box` the edge, and a
  transparent border reveals it. That is the only way to get a gradient border without a
  wrapper element
- **cursor spotlight** in each card's own accent, positioned by `--spot-x`/`--spot-y`
  written straight to the element. Not React state: a mousemove handler that calls
  `setState` re-renders the subtree every pixel, and this is pure paint. `:focus-within`
  covers keyboards
- **charts carry real data** from the fixed example day — gradient area fill, a wide soft
  stroke as glow, and the price behind as a dashed ghost
- **the ghost inverts the dashboard's solid/dashed convention, deliberately.** There the
  two series are peers and line style separates them; here the metric is the subject and
  price is context. Nothing on the card depends on telling them apart — the heading, unit
  chip and stat line all name the metric. The dashboard's rule is untouched
- unit lives in a chip in the header chrome, not repeated in the stat sentence
- stats end in a **reading count** (`24 of 24 hours`, or `1 hour without a reading`),
  which is the thing the card could not say before
- the arrow button **fills with the accent on hover** rather than nudging sideways
- **the middle card is bigger, not moved** — `lg:p-8` and a taller chart, with the grid on
  `lg:items-center` so the outer two centre against it. A `translate` was tried first and
  is the wrong tool: it shifts a card of the same size, so the row reads as one card
  knocked out of line rather than one card given more room
- **its extra height goes into the chart** (`lg:h-36` against `h-24`), not into empty space
  at the bottom. Growing the padding alone would have made it bigger and emptier
- this used to emphasise the *default metric* with depth alone, on the grounds that lifting
  it looked misaligned — true, because the default is the **first** of the three. Only the
  centre card can be grown without the row going lopsided
- **the flanking cards step back** with `.bento-quiet`: the same construction, a lighter
  fill. Lighter rather than darker, because these sit on `--page` and weight comes from
  contrast against a *light* ground — 16.34:1 for the featured ink against 13.61:1 for the
  quiet one. Values and their contrast checks live in `ui-tokens.md`
- **the emphasis moved rather than doubling.** A shadowed first card and a raised second
  would be two competing focal points, so `featured` is now positional. The
  "this is what the dashboard opens on" signal lives in the hero preview alone, which
  still opens on `DEFAULT_WEATHER_METRIC`
- `translate` rather than a margin, so the lift costs no layout and the neighbours do not
  reflow; `lg:` only, since a raised card in a stacked column is just a stray gap. The
  list carries `lg:pt-6` to reserve the room the lift moves into

## Metric highlight cards (superseded)

`src/app/_components/metric-highlights.tsx` — three cards below the hero, one per weather
metric, on a `bg-page` section.

- outer cards `bg-surface-selected text-fg`; the featured card `bg-surface-inverse
  text-fg-inverse`
- the featured card is **taller**, and the grid uses `lg:items-center` so the outer two
  centre against it. That is what lifts the middle card — not a shadow
- `min-h-80` / `lg:min-h-96` (featured `lg:min-h-[26rem]`) leaves the lower area open for
  artwork, with the link pinned by `mt-auto`
- each card links to `/dashboard?day=today&metric=<id>` — a real filtered view, not a
  "Read more" pointing nowhere. Signed-out visitors are redirected to sign in
- artwork bleeds off the bottom-right corner, tinted with that metric's **chart colour**,
  so a card and its series on the dashboard read as the same thing
- the motifs are **instruments, not readings** — a gust, a thermometer, a sun. A stylised
  price curve would put invented market data on the marketing page
- the featured card overrides the focus ring (`focus-visible:outline-fg-inverse`), since
  the global `--focus` navy is invisible on it

## Landing hero band

`src/app/page.tsx` — the band holding the headline, the CTAs and the preview card, over a
photograph of the region the data describes.

- **`public/hero.png` as the background**, through `next/image` with `fill` and
  `priority`. Not a CSS `background-image`: the source is a 2.7 MB PNG and `next/image`
  serves a resized WebP/AVIF instead — **28 KB at 640w, 196 KB at 1920w**, measured. A
  landing page whose argument is speed cannot ship the original, and `priority` also
  preloads it, since it is the LCP element
- **`alt=""` — decorative.** It shows the region the data covers but carries nothing the
  headline does not, and a description of scenery announced before the product name is
  noise
- **`isolate` on the band.** The photograph and its scrim sit at `-z-10`; without a new
  stacking context they drop behind the page background rather than behind this band's
  content. `bg-surface-inverse` stays underneath, so the hero is the same navy while the
  image loads and if it never arrives
- **The scrim is load-bearing, not styling.** Measured against the asset: the brightest
  pixel under the text area is pure white, so these are true worst cases —

  | scrim | `--fg-inverse` | `--fg-inverse-muted` |
  | --- | --- | --- |
  | 80% | 10.18:1 | 6.24:1 |
  | 75% | 8.45:1 | 5.18:1 |

  The gradient bottoms out at **75%**, and the muted paragraph fails first. Do not lighten
  it without re-measuring — AA wants 4.5:1 there, leaving 0.68 in hand. Re-measure if the
  image is swapped
- `bg-linear-to-r`, not `bg-gradient-to-r`: this is Tailwind 4, where the utility was
  renamed. The v3 name emits nothing

- **One pill, one text link.** The primary is `SessionCta` (`inverse`, `lg`); the secondary
  is "How the data is joined" as **text plus a right arrow**, not a second pill. It was
  `ghost-inverse`, and even unfilled it read as a peer of the primary — two controls of
  equal weight leave a visitor to work out which one the page wants
- **the arrow is the affordance**, which is what lets the underline come off at rest.
  `ui-rules.md` requires an underline because `--link` is near-indistinguishable from body
  text by colour; a directional glyph answers that requirement with a second, non-colour
  signal. Underline arrives on hover, the arrow slides `translate-x-1`. Same pattern as the
  bento cards' "Open the … view"
- **the focus ring is overridden** (`focus-visible:outline-fg-inverse`) — as anything
  focusable on this band must be

- **`min-h-[70svh]` with `content-center`.** `svh`, not `vh`: `vh` resolves against the
  *largest* viewport, so on mobile the hero would stand taller than the screen until the
  browser chrome retracted
- **`min-h`, never `h`.** The section still grows past 70% when the content needs it. At
  200% zoom, or on a short landscape phone, a fixed height clips the headline and the CTAs
  instead of reflowing — the same rule as `--chart-min-height`, for the same reason

## Hero preview card

`src/app/_components/hero-preview.tsx` — the dashboard preview beside the headline.

- **Real market data, not a mock-up.** The day is a fixed constant (`PREVIEW_DAY`), so no
  clock is involved and the card prerenders. Reading "today" would make the marketing page
  request-time for a decorative chart
- **inline SVG, not ECharts.** A static picture on a landing page does not justify
  shipping a charting library; geometry comes from `toPreviewChart`, a pure tested
  function
- each series is scaled to its **own** range, like the real dual axes — comparable in
  shape only, never in height
- a gap starts a new subpath rather than being bridged, even here
- the metric pills are **links into the real dashboard view** for that metric: they look
  like controls and behave like them
- labelled "Real market data". The reference said "illustrative"; ours does not have to,
  because the shape is what actually happened. The card header already dates the day, so
  the footer does not repeat it
- **the previewed metric is `DEFAULT_WEATHER_METRIC`**, not a hand-picked one. Previewing
  a different metric made the hero, the featured card below and the dashboard itself open
  on three different things
- **the plot is inset horizontally** (`plotLeft` / `plotRight` from `toPreviewChart`).
  Hour 0 used to map to `x=0`, which put the midnight tick's own glyph half outside the
  viewBox — "00" rendered as "0" — and ran both curves into the panel edge. Anything
  drawing its own geometry over this chart uses those bounds, not `0` and `width`
- **the metric leads, the price grounds it.** The metric carries a gradient area plus a
  wide soft stroke as its glow — the same treatment as the bento cards below, which the
  hero lacked despite being the more prominent chart. Price stays the white line it is in
  the legend
- **the price fill lands on transparent at 78%, not at the baseline.** A flat white wash
  over the full height desaturates to grey on navy and became the largest, least
  meaningful shape on the card
- **three gridlines at `opacity 0.08`**, so the curves read against levels rather than
  floating. Decorative under SC 1.4.11 and deliberately far below the line tokens
- **the highlighted hour is named on the chart**, in a pill at the top of the crosshair,
  with a haloed dot on each series. The stat strip above describes that hour; without the
  label the connection between the three figures and that position had to be inferred
- the metric pills **override the focus ring** (`focus-visible:outline-fg-inverse`). They
  sit on `--surface-inverse`, and the global `--focus` is `--navy-900` — the same colour,
  so the default ring was invisible against its own background. Any focusable placed on a
  dark surface needs this; the bento cards already carried it, these were missed
- **trimmed to the minimum that still explains itself.** The card said several things
  three times: the hour had a stat column *and* the crosshair chip; the two series were
  named by the pills, by the stat labels, and again by a footer legend. Gone are the hour
  column and the whole footer — legend and the "Real market data" label with it
- **the legend's one unique fact moved rather than died.** Only it said which colour was
  which line, so that became a short rule on the stat labels, which already existed. The
  row went; the mapping did not
- **the hour moved into the "Example day" line**, which was already setting the scene, so
  the figure appears once in small type instead of twice with one of them the largest text
  on the card
- the SVG is `aria-hidden` — the two remaining figures are its text alternative, which is
  why they are the part that cannot be trimmed away

## Hero visual (removed)

`src/app/_components/hero-visual.tsx` — an inline offshore wind scene, decorative and
`aria-hidden`, with a `videoSrc` hook for swapping in a licensed clip.

**Deleted 2026-08-10.** It had been unreferenced since `HeroPreview` replaced it in the
colour-restraint pass — 237 lines of animated SVG that nothing rendered, still documented
here as though it were live. It is recoverable from git history if the hero ever wants a
decorative treatment again; what it was worth keeping for is recorded below.

- depth was carried by three consistent signals: size, position relative to the horizon,
  and rotation speed. Nearer turbines larger, lower and faster
- rotors need `transform-box: view-box` on the animated group so `transform-origin`
  resolves in SVG user units — without it the blades orbit the bounding box and wobble
- it depicted nothing resembling data. A decorative price curve would have put fabricated
  market figures on the marketing page of a tool premised on not fabricating them — the
  same reasoning that later removed the login card's curve

## Not yet established

- stale-data indication (nothing yet distinguishes "retrieved 3 hours ago" from fresh)
