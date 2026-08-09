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

## Not yet established

Patterns the next slices need to define, listed so they get decided once rather than
improvised per component:

- day / metric selector controls (segmented control; selected state uses
  `surface-selected` + `line-selected`)
- summary card
- chart container and its legend
- data table, including the disclosure that expands it
