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
- **Links stay on the nordic accent.** At near-black, a link would be indistinguishable
  from body text and the underline would be its only affordance. `--link` is therefore
  the one place the primary is deliberately *not* used.

The nordic ramp is retained as an accent for links and the `info` status family.

| Step | Value | Role |
| --- | --- | --- |
| `--navy-50` | `#eef0f7` | selected surfaces |
| `--navy-100` | `#dfe3f0` | secondary action background |
| `--navy-200` | `#c3cae2` | secondary action hover |
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
| `--surface-inverse` | `bg-surface-inverse` | `--navy-900` | tooltips, inverse chips |

### Foreground

| Token | Utility | Value | Use for |
| --- | --- | --- | --- |
| `--fg` | `text-fg` | `--slate-900` | headings, primary values |
| `--fg-secondary` | `text-fg-secondary` | `--slate-700` | body copy |
| `--fg-muted` | `text-fg-muted` | `--slate-600` | labels, units, captions |
| `--fg-inverse` | `text-fg-inverse` | `--white` | text on inverse surfaces |
| `--link` | `text-link` | `--nordic-700` | links — always with underline; see *The primary* |
| `--icon` | `text-icon` | `--slate-600` | standalone icons |

Renamed from `--color-text-*` / `--color-icon-default`: Tailwind derives the utility from
the token name, so `--color-text-primary` would have produced `text-text-primary`.

### Lines and focus

| Token | Utility | Value | Use for |
| --- | --- | --- | --- |
| `--line` | `border-line` | `--slate-300` | dividers, card borders |
| `--line-strong` | `border-line-strong` | `--slate-500` | control borders |
| `--line-selected` | `border-line-selected` | `--navy-900` | selected control |
| `--focus` | `outline-focus` | `--navy-900` | focus ring |

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
| `--chart-price` | `#2563eb` | spot price — solid line, left axis |
| `--chart-price-fill` | `rgb(37 99 235 / 14%)` | restrained area fill under price |
| `--chart-wind` | `#0f766e` | wind speed — dashed, right axis |
| `--chart-temperature` | `#c2410c` | temperature — dashed, right axis |
| `--chart-solar` | `#a16207` | solar radiation — dashed, right axis |
| `--chart-missing` | `--slate-500` | gaps — never rendered as zero |
| `--chart-grid` | `--slate-200` | grid lines |
| `--chart-axis` | `--slate-600` | axis labels (text: 4.5:1) |
| `--chart-crosshair` | `--slate-700` | crosshair |
| `--chart-tooltip-surface` / `--chart-tooltip-fg` | `--navy-900` / `--white` | tooltip |

Only the five series colors are bridged to utilities (`bg-chart-price`, …), for DOM
legend swatches and table keys. The chart itself reads layer 2 via `getComputedStyle`.

> **The one real risk in this palette.** All four series clear 3:1 against `--surface`
> (4.92–5.47:1) but sit at *near-identical luminance*, so they separate by **hue alone** —
> price vs. wind is ~1.06:1 against each other, and the closest pair under simulated
> deuteranopia and protanopia. This is acceptable only because price renders as a solid
> area and the weather metric as a dashed line on a separate axis. **That distinction is
> load-bearing accessibility, not styling.** Two solid lines would break "never rely on
> color alone." Enforce it in `ui-rules.md`.

---

## Non-color tokens

| Token | Utility | Value |
| --- | --- | --- |
| `--radius-control` | `rounded-control` | `0.5rem` — buttons, inputs, toggles |
| `--radius-card` | `rounded-card` | `0.75rem` — cards, panels |
| `--radius-pill` | `rounded-pill` | `9999px` — chips, segmented controls |
| `--shadow-card` | `shadow-card` | subtle two-stop card elevation |
| `--shadow-popover` | `shadow-popover` | tooltips, menus |
| `--container-content` | `max-w-content` | `72rem` page max width |
| `--text-display` | `text-display` | `clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)` |
| `--font-sans` / `--font-mono` | `font-sans` / `font-mono` | Geist / Geist Mono |
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
| `--link` on `--surface` | 7.56:1 | 4.5 |
| `--on-action-primary` on `--action-primary` | 18.67:1 | 4.5 |
| `--on-action-primary` on `--action-primary-hover` | 15.68:1 | 4.5 |
| `--on-action-secondary` on `--action-secondary` | 14.56:1 | 4.5 |
| `--on-action-secondary` on `--action-secondary-hover` | 11.44:1 | 4.5 |
| `--fg` on `--surface-selected` | 16.39:1 | 4.5 |
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
