# Progress Tracker

Living status for **Nordic Power & Weather Explorer**. Per `AGENTS.md`, update this file
after every feature — alongside `ui-registry.md`.

**Last updated:** 2026-08-09
**Current phase:** Phase 1 complete (in review) → Phase 2 next
**Gates:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 1 passed · `pnpm build` ✅

---

## Workflow

**GitHub Flow.** `main` is always deployable. One short-lived task branch per slice →
PR → `main`. No long-lived `dev` branch (it was dropped in Phase 1; it sat on the same
commit as `main` and only added a second merge per change).

Branch naming follows Conventional Commits: `chore/`, `test/`, `feat/`, `docs/`.
Keep commits small and individually green — never batch a phase into one commit.

---

## Phase status

| Phase | Status |
| --- | --- |
| 0 — Foundation | ✅ merged |
| 1 — Dependencies and configuration | ✅ complete, **4 PRs open** |
| 2 — Providers and alignment | ⬜ next |
| 3 — Page composition and states | ⬜ not started |
| 4 — Chart | ⬜ not started |
| 5 — Cards, insights, data view | ⬜ not started |
| 6 — Accessibility, performance, polish | ⬜ not started |

### Open pull requests

| # | Branch | Contents | Base |
| --- | --- | --- | --- |
| 1 | `chore/deps-charts-dates` | echarts, echarts-for-react, date-fns, @date-fns/tz | `main` |
| 2 | `test/vitest-setup` | vitest, RTL, jsdom, scripts | **stacked on #1** |
| 3 | `feat/cache-components` | `cacheComponents: true` | `main` |
| 4 | `feat/shared-config` | `src/shared/config` | `main` |

**Merge #1 before #2** — both touch `pnpm-lock.yaml`, so #2 was stacked to avoid a
conflict. #3 and #4 are independent and can merge in any order.

Still no feature code. `src/app/page.tsx` remains the scaffold landing page, migrated
onto design tokens so it renders correctly; it is replaced in Phase 3.

---

## Completed

### 2026-08-09 — Phase 1: dependencies and configuration

Four slices, one commit each:

- **Runtime deps** — echarts 6.1.0, echarts-for-react 3.0.6 (peer range is
  `react >=16`, so React 19.2.8 needs no override), date-fns 4.4.0, @date-fns/tz 1.5.0.
  Plain date-fns cannot do IANA zone conversion; the v4 companion supplies `TZDate`.
- **Test harness** — vitest 4 + @vitejs/plugin-react + jsdom, RTL 16 (supports React 19),
  jest-dom matchers. `vitest.config.mts` duplicates the `@/* → ./src/*` alias because
  Vitest does not read tsconfig paths. `.mts` avoids the CJS/ESM warning from Vite's
  native config loader. Globals stay off so `tsconfig` needs no `types` override, which
  would shadow default `@types` resolution. Added `typecheck`, `test`, `test:watch`.
- **Cache Components** — `cacheComponents: true`. Isolated because it changes rendering
  semantics app-wide: PPR becomes default, request-time APIs must sit inside
  `<Suspense>`, and the app is pinned to the Node.js runtime.
- **Shared config** — `src/shared/config` as the single door for `Europe/Oslo`, NO1,
  Oslo coordinates, base URLs, the three weather variables with units, request timeout,
  publication hour, and `cacheLife` profiles.

### 2026-08-09 — Phase 0: foundation

- Moved `app/` → `src/app/`; `@/*` now resolves to `./src/*`. `features/` does not exist
  yet; `shared/` was created in Phase 1.
- Design tokens in `src/app/globals.css` as a single stylesheet: foundation scale →
  semantic tokens in `:root` → `@theme` Tailwind bridge, plus the base layer (body,
  global `:focus-visible` ring, `prefers-reduced-motion`).
- Semantic tokens kept as real `:root` custom properties so the ECharts canvas can read
  them via `getComputedStyle` — canvas cannot consume `var()`.
- Renamed tokens that would have produced awkward utilities: `--color-text-*` → `--fg-*`,
  `--color-border-*` → `--line*`, `--color-*-text` → `--*-fg`. Promoted the one inline
  literal (`#bae6fd`) to `--nordic-200`.
- Extended beyond color: radii, shadows, `--container-content`, fluid `--text-display`,
  `--chart-min-height`. Spacing left on Tailwind's default scale.
- Cleared Tailwind's default palette (`--color-*: initial`) and added a
  `no-restricted-syntax` guard in `eslint.config.mjs` rejecting hex values, color
  functions, and raw palette classes. Verified it fires on all four violation forms.
- Light-only theme; scaffold's `prefers-color-scheme: dark` block removed,
  `color-scheme: light` pinned.
- Verified in the built CSS that token utilities emit, the raw palette is gone, and
  semantic tokens survive in `:root` for the chart.
- Context docs written: `architecture.md`, `ui-tokens.md`, `ui-rules.md`,
  `code-standards.md`, `library-docs.md`, `build-plan.md`, this file.

---

## Open decisions

| Question | Status |
| --- | --- |
| `AGENTS.md` rule 4 says "run `/recover`", but `skills/` was deleted — the skill does not exist | **unresolved**: restore under `.claude/skills/` (where they would actually be invocable) or edit the rule |
| `ui-registry.md` does not exist yet, though `AGENTS.md` requires updating it every feature | create at `context/ui-registry.md` before the first component (Phase 4) |
| ~~`PROJECT_DESCRIPTIONS.md` duplicates `project-overview.md`~~ | ✅ resolved — deleted |
| ~~`ui-registry.md` location ambiguity~~ | ✅ resolved — `context/`, since `skills/imprint` is gone |
| ~~date-fns timezone companion package~~ | ✅ resolved — `@date-fns/tz` 1.5.0 |

---

## Known risks

- **Chart palette separates by hue alone.** All four series sit at near-identical
  luminance; the solid-vs-dashed distinction is what satisfies "never rely on color
  alone." Do not simplify the line styles. See `ui-tokens.md`.
- **Tomorrow's prices publish ~13:00 Europe/Oslo.** A miss must not be cached at the same
  lifetime as a hit. `CACHE_PROFILE.pricesPending` exists for exactly this.
- **Alignment must join on normalized timestamps, never array index.** DST days have 23
  or 25 hours.
- **Cache Components is on**, so `searchParams` and other request-time APIs must live
  inside a `<Suspense>` boundary, and no route may set `runtime = 'edge'`.
- **Generated route types** (`LayoutProps`/`PageProps`) only exist after `next dev` or
  `next build`; a cold clone type-errors until then.
- **The Vitest alias is a second copy** of the `@/*` mapping. Changing it in
  `tsconfig.json` means changing `vitest.config.mts` too.
