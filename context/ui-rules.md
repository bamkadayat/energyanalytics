# UI Rules

How to apply the design system. Token values live in `ui-tokens.md`; established
component patterns live in `ui-registry.md`. This file is the rules for using both.

---

## Token discipline

1. **Utilities first.** `bg-surface`, `text-fg-muted`, `border-line`, `rounded-card`.
2. **`var(--token)` only when no utility fits** — e.g. `min-h-[var(--chart-min-height)]`,
   or ECharts options resolved at runtime.
3. **Never reference a foundation token** (`--slate-600`, `--nordic-700`) outside
   `globals.css`. They are implementation detail; semantic tokens are the contract.
4. **Links are underlined at rest, never on hover alone.** `--link` is the navy primary,
   so colour alone does not distinguish a link from body text — the underline is the
   affordance, not decoration.
5. **Never write a hex value, `rgb()`, or a raw Tailwind color class.** This is enforced
   by `no-restricted-syntax` in `eslint.config.mjs` — `pnpm lint` fails. Do not silence
   the rule; fix the color.
6. A color that has no semantic token yet is a **missing token**, not a licence to inline
   a value. Add it to `src/app/globals.css` and `ui-tokens.md` together.

Use `--on-*` foregrounds only on their paired background. `text-on-action-primary` outside
`bg-action-primary` is a bug.

---

## The chart

The primary visualization carries most of this project's accessibility risk. These are
hard rules, not preferences.

- **Spot price:** solid line, restrained area fill (`--chart-price-fill`), **left** axis,
  `NOK/kWh`.
- **Weather metric:** **dashed** line, **right** axis, its own unit.
- **The solid/dashed distinction is load-bearing accessibility.** All four series colors
  sit at near-identical luminance and separate by hue alone (see the audit in
  `ui-tokens.md`). Two solid lines would violate "never rely on color alone." Never
  "simplify" the line styles.
- Both axes labelled with name **and** unit. Dual axes must never imply direct
  comparability — independent scales, obviously distinct.
- Axis-triggered crosshair tooltip showing both values at the same timestamp.
- Canvas renderer. Nonessential animation disabled. Respect `prefers-reduced-motion`
  (already handled globally in `globals.css`).
- Fluid height via `--chart-min-height`. **Never a fixed pixel height** — it breaks text
  zoom and small screens.
- Resolve colors with `getComputedStyle(document.documentElement).getPropertyValue(...)`
  and `.trim()` the result. Canvas cannot consume `var()`.
- Gaps render as gaps (`--chart-missing`), never as zero.
- The required qualifier goes near the chart, styled with the `info` family:

  > Oslo weather is shown as a representative location within NO1. Visual relationships
  > are exploratory and do not demonstrate causation.

The chart is never the only way to understand the result. The data table and the text
summary are required alternatives, not enhancements.

---

## State presentation

Each state gets a distinct, readable treatment. Map to the status families in
`ui-tokens.md`:

| State | Family | Must include |
| --- | --- | --- |
| Loading | neutral | a labelled skeleton or status text, not a bare spinner |
| No data | neutral | what is missing and for which day |
| Tomorrow not published yet | `warning` | that prices publish ~13:00 Europe/Oslo |
| Partial data | `warning` | which source failed, what is still shown |
| Stale data | `warning` | when it was last fetched |
| Provider error | `error` | plain-language cause + retry where retrying helps |

**Color never carries the state alone** — always an icon *and* text. Announce changes with
a live region only where it adds real value; a chatty live region is worse than none.

---

## Accessibility

Target WCAG 2.2 AA. Beyond the token-level contrast already verified:

- Semantic HTML: real headings in order, landmarks, `<button>` for actions, `<table>` for
  the data table, `<label>` tied to every control.
- Every control keyboard operable; the global `:focus-visible` ring must stay visible —
  never `outline: none` without an equivalent replacement.
- **The global focus ring is `--focus`, a near-black navy, so it is invisible on
  `--surface-inverse`.** Anything placed on a dark surface must override it. Buttons do
  this through `--btn-ring-color`; other controls need their own override.
- Never rely on color, line style, position, or icon **alone** — pair at least two.
- Chart controls need accessible names, and the chart's purpose must be stated in
  surrounding text.
- Format numbers and dates for the locale, but keep units explicit and visible.
- Test keyboard flow, reflow at narrow widths, and 200% zoom by hand. Automated checks
  catch a minority of real issues.

---

## Responsive and layout

- Relative units — `rem`, `%`, `min()`, `max()`, `clamp()`. Avoid fixed pixel heights on
  anything containing text or the chart.
- Mobile layout first, enhanced upward. Controls stay operable at 200% zoom and at narrow
  widths.
- Page width capped with `max-w-content`; spacing from Tailwind's default scale.
- **Every button is `rounded-pill`.** Never style a button inline — import
  `Button` or `buttonClasses` from `shared/ui`. That module is the only place button
  styling exists, and a test pins the radius, so consistency survives new authors.
- `rounded-control` is for **inputs**: text fields, textareas, selects. The distinction
  is controls you press versus controls you type into.
- `rounded-card` for cards, panels and banners. No other radii.
- `shadow-card` for elevation, `shadow-popover` for overlays. Prefer a border to a shadow
  for flat separation.

---

## Content

- Never claim causation. "Moves with", "coincides with" — not "because of", "driven by",
  "caused by".
- Prices are day-ahead spot prices in `NOK/kWh`, **excluding VAT, grid charges, and other
  consumer costs.** State this where prices are shown.
- Always label Oslo as a representative point within the larger NO1 region.
- Show source attribution and last-fetched time.
- Insights are deterministic and factual only — min/max hour, peak timing, comparison to
  the daily average. No inferred explanations, no LLM-generated market commentary.

---

## Before building a component

1. Read `ui-registry.md` — match an existing pattern before inventing one.
2. Build with tokens only.
3. Keep business logic out; components take narrow props (`architecture.md`).
4. Run `/imprint` afterwards so the pattern is recorded for the next component.
