# UI Tokens

Design tokens for **Nordic Power & Weather Explorer**. Light theme only.

**Implementation:** `src/app/globals.css` — the single stylesheet, holding the tokens and
the base layer. It is the executable copy; this document is the reference and the
rationale. Change both together — a token added in CSS but not recorded here will drift.

Colors exist in exactly one file. `eslint.config.mjs` enforces that: a hex value, a
`rgb()`/`oklch()` call, or a raw Tailwind color class anywhere in `src/` is a **lint
error**, so `pnpm lint` fails rather than the class silently generating nothing.

Component-level patterns composed *from* these tokens belong in `ui-registry.md`;
the rules for applying them belong in `ui-rules.md`.

---

## Structure: three layers

| Layer | Where | Purpose | Components use it? |
| --- | --- | --- | --- |
| **1. Foundation** | `:root` — `--navy-900`, `--slate-600` | raw scale values | ❌ never |
| **2. Semantic** | `:root` — `--fg-muted`, `--action-primary` | role-named, runtime-readable | only when no utility fits |
| **3. Tailwind bridge** | `@theme inline` — `--color-fg-muted` | generates utility classes | ✅ the default |

All three live in `src/app/globals.css`, in that order.

Layer 2 lives in `:root` as real custom properties on purpose. `@theme inline` does
**not** emit them, and the chart resolves its colors with
`getComputedStyle(document.documentElement)` because canvas cannot consume `var()`.
Moving the semantic layer inside `@theme` would silently break the chart.

Tailwind's built-in palette is cleared with `--color-*: initial`, so raw color utilities
(`bg-zinc-50`, `text-black`) generate no CSS at all. On its own that fails *silently* — the
class does nothing and the page just looks subtly wrong — which is why the ESLint guard
above exists to turn it into a build-breaking error.

Names in layer 3 mirror layer 2 exactly, prefixed with `--color-`. Layer 1 dropped its
`--color-` prefix so foundation values can never collide with Tailwind's namespace or be
mistaken for theme tokens.

---

## The primary

**`#0B1128` — `--navy-900`.** A deep midnight navy, and the anchor for every primary
action, the focus ring, the selected-control border, and inverse surfaces.

It sits at luminance 0.006, very close to black, which drives two decisions:

- **Interaction states move lighter, not darker.** Darkening a near-black base produces
  no perceptible change, so hover lightens to `--navy-800` and only `active` goes darker
  to `--navy-950`.
- **Links use it too**, so nothing branded drifts to a second blue. The consequence is
  that a link is close to body text in colour, which makes the underline load-bearing:
  links must be underlined **at rest**, never on hover alone. That is a rule in
  `ui-rules.md`, not a preference.

The nordic ramp is retained for the `info` status family only.

| Step | Value | Role |
| --- | --- | --- |
| `--navy-50` | `#eef0f7` | selected surfaces |
| `--navy-100` | `#dfe3f0` | secondary action background |
| `--navy-200` | `#c3cae2` | secondary action hover |
| `--navy-500` | `#5b6591` | control borders on dark surfaces |
| `--navy-800` | `#16204a` | primary hover (lighter) |
| **`--navy-900`** | **`#0b1128`** | **the primary** |
| `--navy-950` | `#06091a` | primary active |

---

## Color tokens

### Surfaces

| Token | Utility | Value | Use for |
| --- | --- | --- | --- |
| `--page` | `bg-page` | `--slate-50` | app background |
| `--surface` | `bg-surface` | `--white` | cards, panels, table |
| `--surface-subtle` | `bg-surface-subtle` | `--slate-100` | inset areas, code, zebra rows |
| `--surface-selected` | `bg-surface-selected` | `--navy-50` | active day / metric toggle |
| `--surface-inverse` | `bg-surface-inverse` | `--navy-900` | tooltips, inverse chips, the chart panel |
| `--surface-rail` | `bg-surface-rail` | `--navy-900` | the dashboard rail and its drawer |
| `--surface-rail-active` | `bg-surface-rail-active` | `--navy-800` | selected/hovered rail item |

### Bento cards

Not utilities — these are consumed by `.bento` and `.bento-quiet` in `globals.css`, which
paint an ink gradient inside a gradient hairline. Two backgrounds with different clip
boxes: `padding-box` fills, `border-box` draws the edge, and a transparent border reveals
it. That is the only way to get a gradient border without a wrapper element.

| Token | Value | Use for |
| --- | --- | --- |
| `--card-ink-from` / `--card-ink-to` | `#171b2b` / `#0e1223` | the featured card's fill |
| `--card-edge-from` / `--card-edge-to` | `#2b3350` / `#141a2c` | its hairline |
| `--card-ink-quiet-from` / `--card-ink-quiet-to` | `#232a3f` / `#1a2032` | cards flanking a featured one |
| `--card-edge-quiet-from` / `--card-edge-quiet-to` | `#333c5c` / `#1e2438` | their hairline |

**The quiet variant is lighter, not darker.** These panels sit on `--page`, so their
weight comes from contrast against a *light* ground — a deeper ink would make the flanking
cards heavier and fight the one they are meant to frame. Against `--page` the featured ink
measures **16.34:1** and the quiet fill **13.61:1**, which is the entire effect.

White text still sits on both: `--fg-inverse` is 14.24:1 and `--fg-inverse-muted` 8.73:1
against `--card-ink-quiet-from`. Re-run those before lightening it further.

> These four `--card-*` tokens predate this table and were not recorded here — the drift
> this document warns about, found while adding the quiet variant.

### Foreground

| Token | Utility | Value | Use for |
| --- | --- | --- | --- |
| `--fg` | `text-fg` | `--slate-900` | headings, primary values |
| `--fg-secondary` | `text-fg-secondary` | `--slate-700` | body copy |
| `--fg-muted` | `text-fg-muted` | `--slate-600` | labels, units, captions |
| `--fg-inverse` | `text-fg-inverse` | `--white` | text on inverse surfaces |
| `--fg-inverse-muted` | `text-fg-inverse-muted` | `--navy-200` | subdued text on inverse surfaces |
| `--link` | `text-link` | `--navy-900` | links — **always underlined at rest** |
| `--icon` | `text-icon` | `--slate-600` | standalone icons |

Renamed from `--color-text-*` / `--color-icon-default`: Tailwind derives the utility from
the token name, so `--color-text-primary` would have produced `text-text-primary`.

### Lines and focus

| Token | Utility | Value | Use for |
| --- | --- | --- | --- |
| `--line` | `border-line` | `--slate-300` | dividers, card borders |
| `--line-strong` | `border-line-strong` | `--slate-500` | control borders |
| `--line-selected` | `border-line-selected` | `--navy-900` | selected control |
| `--line-inverse` | `border-line-inverse` | `--navy-800` | hairlines **on dark surfaces** |
| `--line-inverse-strong` | `border-line-inverse-strong` | `--navy-500` | control borders **on dark surfaces** |
| `--focus` | `outline-focus` | `--navy-900` | focus ring |

The two inverse line tokens split the same way `--line` and `--line-strong` do on light
surfaces: `--line-inverse` separates regions, `--line-inverse-strong` bounds something you
interact with. Use the strong one for any field or control edge — WCAG 2.2 asks 3:1 for a
control boundary, and the hairline is nowhere near it.

### Price emphasis

| Token | Utility | Value | Use for |
| --- | --- | --- | --- |
| `--price-bar` | `bg-price-bar` | `--navy-100` | an ordinary hour in the price strip |
| `--price-now` | `bg-price-now` | `--navy-800` | the hour you are in, and the coverage bar |

Two tones, not six. The cheapest and priciest hours briefly had their own green and red;
that spent the loudest colours on the page inside a sparkline, to say what the bar heights
already said and the cards beside them state in words. Height cannot show *where you are*,
so that is the only hour with a fill.

Renamed from `--color-border-*` / `--color-focus-ring`, which would have produced
`border-border-subtle` and `ring-focus-ring`.

The focus ring is applied globally in `globals.css` via `:focus-visible`
(`2px solid`, `2px` offset), so every keyboard-reachable control gets one by default.

### Actions

| Token | Utility | Value |
| --- | --- | --- |
| `--action-primary` | `bg-action-primary` | `--navy-900` |
| `--action-primary-hover` | `hover:bg-action-primary-hover` | `--navy-800` (lighter) |
| `--action-primary-active` | `active:bg-action-primary-active` | `--navy-950` |
| `--on-action-primary` | `text-on-action-primary` | `--white` |
| `--action-secondary` | `bg-action-secondary` | `--navy-100` |
| `--action-secondary-hover` | `hover:bg-action-secondary-hover` | `--navy-200` |
| `--on-action-secondary` | `text-on-action-secondary` | `--navy-900` |
| `--disabled` | `bg-disabled` | `--slate-200` |
| `--on-disabled` | `text-on-disabled` | `--slate-600` |

`--on-*` names the foreground that pairs with a specific background. Never mix pairs.

Note the hover direction: `--action-primary-hover` is **lighter** than the base, which
is the opposite of the usual convention and is correct here because the base is nearly
black.

### Status

Four families, each `surface` / `line` / `fg`. **Always pair with text or an icon** —
color alone never carries the meaning.

| Family | Surface | Line | Foreground |
| --- | --- | --- | --- |
| `success` | `#dcfce7` | `#16a34a` | `#166534` |
| `warning` | `#fef3c7` | `#d97706` | `#92400e` |
| `error` | `#fee2e2` | `#dc2626` | `#991b1b` |
| `info` | `--nordic-100` | `#0284c7` | `--nordic-700` |

Mapping to the app's states: `warning` for *tomorrow's prices not published yet* and for
partial or stale data; `error` for provider failure; `info` for the non-causation
qualifier and provenance notes.

### Data visualization

| Token | Value | Series |
| --- | --- | --- |
| `--chart-price` | `--navy-800` | spot price — solid line, left axis |
| `--chart-price-fill` | `rgb(22 32 74 / 6%)` | restrained area fill under price |
| `--chart-wind` | `--navy-500` | wind speed — dashed, right axis |
| `--chart-temperature` | `--navy-500` | temperature — dashed, right axis |
| `--chart-solar` | `--navy-500` | solar radiation — dashed, right axis |
| `--chart-missing` | `--slate-500` | gaps — never rendered as zero |
| `--chart-grid` | `--slate-200` | grid lines |
| `--chart-axis` | `--slate-600` | axis labels (text: 4.5:1) |
| `--chart-crosshair` | `--slate-700` | crosshair |
| `--chart-tooltip-surface` / `--chart-tooltip-fg` | `--navy-900` / `--white` | tooltip |

### Heatmap ramp (removed)

**These tokens no longer exist.** The heatmap became a boxplot on 2026-08-10 and the ramp
went with it; nothing in `globals.css` defines `--heat-*` and nothing consumes it. Kept
for the reasoning, which applies to any sequential scale added later.

`--heat-0` … `--heat-5` were: `#eef2fb` · `#cfdcf6` · `#9dbaee` · `#5b8ae0` · `#2563eb` ·
`#16357f`.

A **single-hue sequential scale, ordered by lightness.** Sequential data has to read as
"more" and "less", and a lightness ramp conveys that in greyscale and under any form of
colour blindness. A rainbow scale looks livelier and communicates nothing ordered — the
same reasoning that keeps the series palette honest about relying on line style.

`--heat-4` was `--chart-price`, so the heatmap and the price line agreed on what "high"
looked like.

Only the five series colors are bridged to utilities (`bg-chart-price`, …), for DOM
legend swatches and table keys. The chart itself reads layer 2 via `getComputedStyle`.

**Two tones, both navy** (2026-08-14, on request). The three metric tokens resolve to the
same value on purpose: `correlation-chart.tsx` and `series-legend.tsx` look the colour up
as `--chart-${metricId}`, so keeping the names is what allows a metric to be
re-differentiated later without touching either component.

This is safe because **only two series are ever drawn at once** — price plus the one
selected metric. The four hues existed because the metric varies, not because four lines
coexist.

| Pair | Ratio | Needs |
| --- | --- | --- |
| price (`--navy-800`) vs `--surface` | 15.68:1 | 3:1 |
| metric (`--navy-500`) vs `--surface` | 5.65:1 | 3:1 |
| metric vs price | 2.77:1 | — |
| metric vs `--chart-grid` | 4.59:1 | — |

Price was `--navy-900` for a few hours on 2026-08-14 and was lightened a step on request —
near-black read as too heavy for a line drawn across a whole card. That trade cost
series-vs-series separation (3.30:1 → 2.77:1) and is **not** a WCAG threshold: two data
lines only have to be told apart, and solid vs dashed is what does that. What matters is
the surface ratio, and both clear 3:1 with room.

Still **better than the palette it replaced**, which cleared 3:1 against `--surface`
(4.92–5.47:1) but sat at near-identical luminance and separated by hue alone — price vs.
wind was ~1.06:1 against each other, and the closest pair under simulated deuteranopia and
protanopia.

> **The solid-vs-dashed distinction matters more now, not less.** It was already
> load-bearing when hue was a redundant fourth signal; with hue gone, line style plus the
> separate axis and the text legend are what carry the distinction. **Never collapse the
> line styles.** Enforced in `ui-rules.md`.

---

## Non-color tokens

| Token | Utility | Value |
| --- | --- | --- |
| `--radius-control` | `rounded-control` | `0.5rem` — **inputs only**: text fields, textareas, selects |
| `--radius-card` | `rounded-card` | `0.5rem` — cards, panels, banners |
| `--radius-pill` | `rounded-pill` | `9999px` — buttons by default, plus chips and segmented controls |
| `--radius-tight` | `rounded-tight` | `0.375rem` (6px) — the login submit button only |

**Radius is assigned by role, not by taste.** The split is *controls you press* versus
*controls you type into*: buttons and button-like links are `rounded-pill` by default, and
inputs are always `rounded-control`. A pill-shaped text field reads as a tag or a search
chip, and long values sit awkwardly against the curve.

This is enforced in code, not by convention — `shared/ui/button.tsx` is the only place
button styling is written, and the radius comes from a `radius` prop with two named
values, not from a free `className`. Tests assert a button emits **exactly one** radius
class, that `pill` is the default, and that `tight` is opt-in.

**`tight` is a deliberate, enumerable exception** (added 2026-08-14, on request), not a
reopening of per-call-site styling. A raw `rounded-[6px]` at the call site would sit
alongside the module's own radius class and resolve by CSS source order rather than by
which was written last — a named option keeps the set of possible radii greppable.
| `--shadow-popover` | `shadow-popover` | tooltips, menus — the only shadow in the system |
| `--container-content` | `max-w-content` | `72rem` page max width |
| `--text-display` | `text-display` | `clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)` |
| `--text-hero` | `text-hero` | `clamp(2.25rem, 1.5rem + 3.6vw, 3.75rem)` — landing headline only |
| `--font-sans` / `--font-mono` | `font-sans` / `font-mono` | Inter / Geist Mono |
| `--chart-min-height` | `min-h-[var(--chart-min-height)]` | `clamp(18rem, 40vh, 28rem)` |

**Spacing has no custom tokens by design.** Tailwind's default `0.25rem` scale *is* the
spacing system; a parallel set would only create drift. Use `p-4`, `gap-6`, and so on.

`--text-display` and `--chart-min-height` are fluid so headings and the chart survive
200% zoom and narrow viewports without media queries. Never give the chart a fixed pixel
height.

---

## Contrast audit

Verified against WCAG 2.2 AA. Every meaning-carrying pair passes:

| Pair | Ratio | Required |
| --- | --- | --- |
| `--fg` on `--surface` | 17.85:1 | 4.5 |
| `--fg-secondary` on `--surface` | 10.35:1 | 4.5 |
| `--fg-muted` on `--page` | 7.24:1 | 4.5 |
| `--link` on `--surface` | 18.67:1 | 4.5 |
| `--on-action-primary` on `--action-primary` | 18.67:1 | 4.5 |
| `--on-action-primary` on `--action-primary-hover` | 15.68:1 | 4.5 |
| `--on-action-secondary` on `--action-secondary` | 14.56:1 | 4.5 |
| `--on-action-secondary` on `--action-secondary-hover` | 11.44:1 | 4.5 |
| `--fg` on `--surface-selected` | 16.39:1 | 4.5 |
| `--fg-inverse` on `--surface-inverse` | 18.67:1 | 4.5 |
| `--fg-inverse-muted` on `--surface-inverse` | 11.44:1 | 4.5 |
| `--on-disabled` on `--disabled` | 6.15:1 | 4.5 |
| status `fg` on status `surface` (all four) | 6.37–6.80:1 | 4.5 |
| `--chart-axis` on `--surface` | 7.58:1 | 4.5 |
| `--focus` on `--page` | 17.84:1 | 3 |
| `--line-selected` on `--surface` | 18.67:1 | 3 |
| `--line-strong` on `--surface` | 4.76:1 | 3 |
| chart series on `--surface` (all four) | 4.92–5.47:1 | 3 |

`--line` (1.48:1) and `--chart-grid` (1.23:1) fall below 3:1. Both are decorative under
SC 1.4.11 and exempt — **but only while they stay decorative.** The moment a border is the
sole indicator of state (selection, error, focus), it must switch to `--line-selected`,
`--line-strong`, or a status line token.

Re-run the audit whenever a color value changes. Last run: after adopting `#0B1128` as
the primary — every meaning-carrying pair still passes, with the primary family now
clearing its minimum by a wide margin.

One thing the numbers do not capture: `--navy-900` and `--navy-800` differ by only
1.19:1, and `--navy-900` and `--navy-950` by 1.06:1. That is intentional for hover and
active states, which should be perceptible rather than dramatic — but it does mean the
primary's states can never be the *only* signal that a control changed. Pair them with
the focus ring, `aria-current`, or a border, as the segmented control already does.

---

## Deliberately absent

- **Dark mode.** Light-only, with `color-scheme: light` pinned so the browser does not
  restyle form controls and scrollbars out from under the theme. Adding a dark tier means
  a second set of layer-2 values *plus* a re-run of both the contrast audit and the chart
  palette check — canvas colors would then also need re-resolving on theme change.
- **A spacing scale** — see above.
- **Per-component tokens.** Those are composed patterns and belong in `ui-registry.md`,
  not in new variables.
