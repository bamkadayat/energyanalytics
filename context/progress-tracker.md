# Progress Tracker

Living status for **Nordic Power & Weather Explorer**. Per `AGENTS.md`, update this file
after every feature — alongside `ui-registry.md`.

**Last updated:** 2026-08-09
**Current phase:** Phase 1 — Dependencies and configuration (not started)
**Build status:** `pnpm lint` ✅ · `pnpm build` ✅ · tests — no runner installed yet

---

## Phase status

| Phase | Status |
| --- | --- |
| 0 — Foundation | ✅ complete |
| 1 — Dependencies and configuration | ⬜ not started |
| 2 — Providers and alignment | ⬜ not started |
| 3 — Page composition and states | ⬜ not started |
| 4 — Chart | ⬜ not started |
| 5 — Cards, insights, data view | ⬜ not started |
| 6 — Accessibility, performance, polish | ⬜ not started |

No application code exists yet. `src/app/page.tsx` is still the scaffold landing page,
migrated onto design tokens so it renders correctly; it gets replaced in Phase 3.

---

## Completed

### 2026-08-09 — Phase 0: foundation

- Moved `app/` → `src/app/`; `@/*` alias now resolves to `./src/*`, so
  `@/features/...` will work. `features/` and `shared/` do not exist yet.
- Design tokens implemented in `src/app/globals.css` as a single stylesheet: foundation
  scale → semantic tokens in `:root` → `@theme` Tailwind bridge, plus the base layer
  (body, global `:focus-visible` ring, `prefers-reduced-motion`).
- Semantic tokens deliberately kept as real `:root` custom properties so the ECharts
  canvas can read them with `getComputedStyle` — canvas cannot consume `var()`.
- Renamed tokens that would have produced awkward utilities: `--color-text-*` → `--fg-*`,
  `--color-border-*` → `--line*`, `--color-*-text` → `--*-fg`. Promoted the one inline
  literal (`#bae6fd`) to `--nordic-200`.
- Extended beyond color: radii, shadows, `--container-content`, fluid `--text-display`,
  `--chart-min-height`. Spacing intentionally left on Tailwind's default scale.
- Cleared Tailwind's default palette (`--color-*: initial`) and added a
  `no-restricted-syntax` guard in `eslint.config.mjs` rejecting hex values, color
  functions, and raw palette classes. Verified it fires on all four violation forms.
- Light-only theme; the scaffold's `prefers-color-scheme: dark` block removed and
  `color-scheme: light` pinned.
- Verified in the built CSS that every token utility emits, that the raw palette is gone,
  and that semantic tokens survive in `:root` for the chart.
- Context docs written: `architecture.md`, `ui-tokens.md`, `ui-rules.md`,
  `code-standards.md`, `library-docs.md`, `build-plan.md`, this file.

---

## Open decisions

| Question | Status |
| --- | --- |
| `ui-registry.md` location — `context/` per `AGENTS.md`, or project root per `skills/imprint` | **unresolved**; pick before the first component |
| `skills/` is not in `.claude/skills/`, so `/architect`, `/review`, `/recover` are not invocable as slash commands | read the `SKILL.md` directly, or move the directory |
| `PROJECT_DESCRIPTIONS.md` duplicates `context/project-overview.md` almost verbatim | delete one before they diverge |
| Exact `date-fns` timezone companion package | confirm at install (Phase 1) |

---

## Known risks

- **Chart palette separates by hue alone.** All four series sit at near-identical
  luminance; the solid-vs-dashed distinction is what satisfies "never rely on color
  alone." Do not simplify the line styles. See `ui-tokens.md`.
- **Tomorrow's prices publish ~13:00 Europe/Oslo.** A miss must not be cached at the same
  lifetime as a hit, or newly published prices stay hidden.
- **Alignment must join on normalized timestamps, never array index.** DST days have 23 or
  25 hours.
- **Generated route types** (`LayoutProps`/`PageProps`) only exist after `next dev` or
  `next build`; a cold clone type-errors until then.
