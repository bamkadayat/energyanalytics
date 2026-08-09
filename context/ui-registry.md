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

| Size | Padding | Use |
| --- | --- | --- |
| `sm` | `px-3 py-1.5 text-sm` | inline actions inside banners and headers |
| `md` | `px-4 py-2 text-sm` | default |
| `lg` | `px-7 py-3 text-base` | the hero call to action |

**Width comes from content, never from a fixed size.** Where a button needs more
presence — the hero call to action against a 4.5rem headline — add a responsive
*minimum* (`sm:min-w-48`), not a width. A fixed width clips a longer label, and this
button's label changes with the session ("Log in" versus "Go to dashboard"). Leave the
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
- `src/app/icon.svg` is the same drawing with the navy pinned, since a favicon has no
  inherited colour to take

---

## Segmented link controls

`src/features/market-correlation/components/view-controls.tsx` — day and metric
selectors.

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

**Provenance footer** — `border-t border-line pt-4 font-mono text-xs text-fg-muted`, one
line per source, each with a `<time dateTime>` carrying the machine-readable instant.
Shown always, not only on success: knowing the data is three hours old matters most when
something looks wrong.

**Loading region** — states what is being waited for rather than spinning, sized with
`min-h-[var(--chart-min-height)]` so the page does not jump, and marked `aria-busy`.

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

`components/insights-list.tsx` — a `<section aria-labelledby>` with an `<h3>`, then a
`<ul>` whose items use `border-l-2 border-line-selected pl-3 text-sm text-fg-secondary`.
A list rather than prose: each observation is independent and should be scannable.

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

## Hero call to action

`src/app/_components/hero-cta.tsx` — the landing page's single control, session-aware.

- signed out → **Log in** (`/login`); signed in → **Go to dashboard** (`/dashboard`).
  A control should say exactly what it does, and "Log in" is a lie to someone already
  logged in
- pill: `rounded-pill bg-surface px-7 py-3 text-base font-medium text-fg`
- reading the session is request-time, so it is mounted in `<Suspense>`; the headline,
  subtitle and visual stay in the prerendered shell rather than the whole page going
  dynamic for one button
- the fallback reserves the exact footprint and shows **no label**. Rendering "Log in"
  and correcting it afterwards would flash the wrong word at the one control that
  matters

## Hero visual

`src/app/_components/hero-visual.tsx` — decorative, `aria-hidden`, in a
`aspect-[4/3] rounded-card border border-line-strong` panel.

Renders a looping `<video>` when `videoSrc` is passed, and otherwise an inline offshore
wind scene: three turbines at different depths with rotating blades and vortex wakes, a
perspective sea grid, drifting wind ticks and a service vessel crossing the horizon.
**Pass a video by dropping a licensed clip into `public/` and setting `videoSrc`;
nothing else changes.**

- SVG gradients and fills take `var(--token)`, so the visual follows the palette rather
  than pinning colours past the ESLint guard
- depth is carried by three consistent signals: size, position relative to the horizon,
  and rotation speed. Nearer turbines are larger, lower and faster
- rotors need `transform-box: view-box` on the animated group so `transform-origin`
  resolves in SVG user units — without it the blades orbit the bounding box and wobble
- keyframes live in `globals.css`; the global `prefers-reduced-motion` rule collapses
  them, so no per-component media query is needed
- it depicts nothing resembling data — a decorative price curve would put fabricated
  market figures on the marketing page of a tool premised on not fabricating them

---

## Not yet established

- stale-data indication (nothing yet distinguishes "retrieved 3 hours ago" from fresh)
