# Library Docs

Project-specific rules for third-party libraries.

Per `AGENTS.md`: **load a library's installed skill first, then read this file.** The
skill teaches the library; this file records how *this* project uses it and what has
already been decided. Where they conflict, this file wins.

---

## Status

| Library | Version | Status |
| --- | --- | --- |
| `next` | 16.3.0 | installed |
| `react` / `react-dom` | 19.2.8 | installed |
| `tailwindcss` | 4.3.3 | installed, configured |
| `eslint` + `eslint-config-next` | 9 / 16.3.0 | installed |
| `echarts` + `echarts-for-react` | — | **required, not yet installed** |
| `date-fns` (+ timezone support) | — | **required, not yet installed** |
| test runner (Vitest + RTL, Playwright) | — | **required, not yet installed** |

Package manager is **pnpm**. Do not use npm or yarn.

---

## Next.js 16

**This is not the Next.js in your training data.** Read the relevant guide under
`node_modules/next/dist/docs/` before writing routing, data-fetching, caching, or metadata
code. Verified specifics for this repo:

- **`searchParams` is a `Promise`** and must be awaited. It is a *request-time API*, so
  where it is read determines how much of the page can prerender. Read it at the page,
  pass resolved primitives down.
- **Route types are generated.** Use the global `LayoutProps<"/">` / `PageProps<"/">`
  helpers rather than hand-written prop types. They are emitted into `.next/types` and
  `.next/dev/types`, so a cold clone type-errors until `next dev` or `next build` has run.
- **Caching uses Cache Components.** Requires `cacheComponents: true` in `next.config.ts`
  — *not yet enabled*; enabling it is a step in `build-plan.md`. Then mark each fetcher
  with `use cache` and always pair it with an explicit `cacheLife`; the implicit `default`
  profile is not a decision. Arguments form the cache key.
  Profiles: `seconds` · `minutes` · `hours` · `days` · `weeks` · `max`.
- Without that flag the project falls back to the previous model (`fetch` options,
  `unstable_cache`, route segment config). **Do not mix the two models.**
- Uncached, request-time content goes inside `<Suspense>` so the shell still prerenders.
- `next dev` rewrites `AGENTS.md`. Commit the regenerated block with your work.

## Tailwind CSS v4

- **There is no `tailwind.config.*` and there must not be one.** Configuration is CSS:
  `@import "tailwindcss"` plus `@theme` blocks in `src/app/globals.css`, which is the
  single stylesheet for the project.
- The default color palette is cleared with `--color-*: initial`, and an ESLint guard
  rejects hex values, color functions, and raw palette classes — see `ui-rules.md`.
- `@theme inline` for tokens whose value references another custom property;
  plain `@theme` for literal values.
- Editors may flag `@theme` as an unknown at-rule. Harmless; the build is authoritative.

## ECharts (when installed)

Required by the spec via `echarts-for-react`. Decisions already made:

- **Canvas renderer**, unless a measured accessibility or product need favors SVG.
- Prefer `dataset` / direct series data over building object arrays per render. Preserve
  Open-Meteo's columnar shape (`architecture.md`).
- Resolve colors from CSS custom properties at runtime with `getComputedStyle` + `.trim()`
  — canvas cannot read `var()`. This forces the chart to be a **client** component; chart
  options cannot be built during server render.
- Nonessential animation off; honor `prefers-reduced-motion`.
- Import only the charts/components used if bundle size warrants it — measure first.
- Dispose/resize handling must not leak between renders.
- The chart is never the sole representation of the data (`ui-rules.md`).

## date-fns (when installed)

- Used for formatting and day arithmetic. **Plain `date-fns` does not do IANA time-zone
  conversion** — pair it with the companion timezone package (`@date-fns/tz` for v4) and
  confirm the correct package/version at install time rather than assuming.
- All zone-aware work goes through **one** helper module in `shared/lib`, reading the
  `Europe/Oslo` constant from `shared/config`. No `Europe/Oslo` literals scattered
  through features, and no ad-hoc `new Date()` parsing of provider strings.
- Never rely on the server's local timezone. Deployment region must not change behavior.
- DST days have 23 or 25 hours. Alignment joins on normalized timestamps precisely so this
  does not silently corrupt a day — do not "fix" it by assuming 24.

## Testing libraries (when installed)

- Vitest + React Testing Library for unit and component tests; Playwright for a small
  number of critical browser checks.
- Add a `test` script and a `typecheck` script at the same time, and update the
  quality-gate list in `code-standards.md`.

---

## Adding a dependency

Do not add one for something the platform, the existing stack, or a small local utility
handles clearly. If it is genuinely warranted, record here: what it is for, why nothing
already present suffices, and its maintenance status, bundle impact, licence, and known
security concerns. Anything not on the list above is out of scope until the user expands
it.
