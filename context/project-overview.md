# AGENTS.md

## Project: Nordic Power & Weather Explorer

Build a polished, single-page energy analytics prototype for a StormGeo frontend interview. The page combines Norwegian day-ahead electricity prices with hourly Oslo weather forecasts and demonstrates strong TypeScript architecture, data visualization, performance, accessibility, and pragmatic engineering.

This is an exploratory visualization. It may show that weather and price values move together at particular times, but it must never claim that one caused the other.

## Product Scope

The first release supports:

- Price area: `NO1` (East Norway)
- Representative weather location: Oslo
- Dates: today and tomorrow
- Weather metrics: wind speed, temperature, and solar radiation
- One primary correlation chart, summary cards, clear status states, and an accessible data table

Keep the prototype focused. Do not add a database, global state management, WebSockets, or speculative production infrastructure unless the user explicitly expands the scope.

**Scope expanded 2026-08-09:** the user added a public landing page and a password gate.
The app is now three routes — `/` (static hero), `/login`, and `/dashboard` (the explorer,
protected). Authentication is a single shared password in an env var, verified server-side
and carried in a signed httpOnly cookie. No database, no user records, no auth library.
Everything else above still holds.

## Data Sources and Domain Truths

### Electricity prices

- Source: Hva koster strømmen API
- Endpoint pattern: `https://www.hvakosterstrommen.no/api/v1/prices/YYYY/MM-DD_NO1.json`
- Treat the data as hourly day-ahead spot prices, not real-time prices.
- Tomorrow's prices may not be available until after approximately 13:00 Europe/Oslo time.
- Display prices as `NOK/kWh`.
- Clearly state that prices exclude VAT, grid charges, and other consumer costs.

Expected fields include:

```ts
export interface RawEnergyPrice {
  NOK_per_kWh: number;
  EUR_per_kWh: number;
  EXR: number;
  time_start: string;
  time_end: string;
}
```

### Weather forecast

- Source: Open-Meteo Forecast API
- Use Oslo coordinates from centralized configuration, not scattered literals.
- Request only the hourly variables used by the interface:
  - `wind_speed_10m`
  - `temperature_2m`
  - `shortwave_radiation`
- Request `timezone=Europe/Oslo`.
- Preserve Open-Meteo's columnar response where practical.

Expected shape:

```ts
export interface RawHourlyWeather {
  time: string[];
  wind_speed_10m: number[];
  temperature_2m: number[];
  shortwave_radiation: number[];
}
```

### Alignment rules

- Use `Europe/Oslo` consistently for fetching, labels, day selection, and timestamp matching.
- Align weather and price records by normalized hourly timestamp, never by array index alone.
- Validate array lengths and numeric values before charting them.
- Treat missing values as missing; do not silently replace them with zero.
- Show the source and last-updated/fetched time in the interface.
- Label Oslo weather as a representative point within the much larger NO1 price region.

## Required Technology

- Next.js with App Router
- TypeScript with strict mode enabled
- Apache ECharts through `echarts-for-react`
- Tailwind CSS
- `date-fns` for date handling

Use the package manager already configured in the repository. Do not introduce a dependency for something the platform, existing stack, or a small utility can handle clearly. Any new dependency must have a specific benefit and be checked for maintenance, bundle impact, licensing, and security concerns.

## Work Process for Coding Agents

Before editing code:

1. Inspect the repository, existing design system, configuration, and package scripts.
2. If Figma Dev Mode or Figma MCP context is available, inspect the relevant frame, components, variables, and responsive behavior before implementing UI.
3. Write a short implementation plan covering component boundaries, data flow, API contracts, state, error cases, accessibility, tests, and performance.
4. Identify assumptions explicitly. Do not invent missing Figma values, API behavior, or product requirements.

During implementation:

- Work in small, reviewable changes.
- Reuse design-system components and tokens before creating new ones.
- Keep business logic outside presentational components.
- Review the diff after each meaningful step.
- Run the relevant tests, linter, type checker, and production build before considering the work complete.

AI-generated code is a draft. The agent remains responsible for understanding, reviewing, testing, and validating every change.

## Architecture

Use feature-based architecture with high cohesion and low coupling:

```text
src/
  app/
    page.tsx
  features/
    energy-prices/
      api/
      components/
      types/
      utils/
      index.ts
    weather-forecast/
      api/
      components/
      types/
      utils/
      index.ts
    market-correlation/
      components/
      types/
      utils/
      index.ts
  shared/
    config/
    lib/
    types/
    ui/
```

### Feature boundaries

- Each feature owns its API access, components, domain types, and domain utilities.
- Every feature exposes a deliberate public API through its root `index.ts`.
- A feature may import from another feature only through that feature's public `index.ts`.
- Never deep-import another feature's internal files.
- `market-correlation` may combine public energy-price and weather types/functions.
- `shared` must remain business-domain agnostic.
- Avoid oversized barrel files and circular dependencies.

Allowed:

```ts
import { type EnergyPrice } from "@/features/energy-prices";
```

Not allowed:

```ts
import { type EnergyPrice } from "@/features/energy-prices/types/internal";
```

### App Router responsibilities

- `src/app/page.tsx` is a server component and acts as a conductor.
- Fetch independent price and weather requests concurrently on the server.
- Pass only the data required for rendering and interaction to client components.
- Mark only interactive leaves with `"use client"`; do not turn the full page into a client component.
- Keep route-level metadata and accessible page structure in the server layer.

### Programming to interfaces

- Define explicit TypeScript contracts at API and component boundaries.
- Parse and validate untrusted API data at the boundary before it reaches visualization code.
- Components should depend on narrow props/contracts, not concrete fetch implementations.
- Do not use `any`; prefer `unknown` at untrusted boundaries and narrow it safely.
- Keep raw provider types separate from normalized domain/view types.

## State: Single Source of Truth

Store each piece of state once and derive everything else.

- Put selected date and weather metric in URL search parameters when practical so the view is linkable and restorable.
- Receive server data through props.
- Keep ephemeral chart state such as hover and zoom local to the chart.
- Derive averages, minimums, maximums, insights, and filtered series from source data; do not duplicate them in state.
- Do not add Redux, Zustand, or another global state library for this prototype.
- Do not use an effect to synchronize values that can be calculated during render.

## Global Configuration

Centralize stable application values, including:

- API base URLs
- NO1 area code and display label
- Oslo latitude, longitude, and display label
- `Europe/Oslo` timezone
- supported weather metrics and units
- cache/revalidation duration
- feature flags, if any

Read environment-specific values through one validated configuration module. Never expose secrets in client bundles, commit credentials, or repeat magic strings across features.

## Fetching, Caching, and Failure Isolation

- Fetch external APIs on the server when possible.
- Use Next.js caching/revalidation deliberately; an initial target of one hour is acceptable for weather, but caching must reflect the provider's actual update behavior.
- Do not cache tomorrow's missing price response for so long that newly published prices remain unavailable.
- Use appropriate request timeouts and return controlled domain errors.
- Allow partial success: if price data loads and weather fails, show the price experience with a weather warning, and vice versa where useful.
- Distinguish these states clearly:
  - loading
  - no data
  - tomorrow's prices not published yet
  - partial data
  - stale data
  - provider/network error
- Provide a meaningful retry action where retrying can help.
- Never fabricate fallback market or weather values. Mock data is allowed only in tests or an explicitly labeled demo mode.

## Data Processing and Performance

- Preserve columnar weather arrays instead of eagerly converting every value to an object.
- Avoid repeated full-array transformations during React renders.
- Normalize and align data in pure, testable utilities.
- Memoize expensive derived chart options only when measurement or data size justifies it.
- Prefer ECharts `dataset`, typed arrays where appropriate, or direct series data over redundant object creation.
- Disable nonessential chart animation.
- Use the Canvas renderer unless a measured accessibility or product need favors SVG.
- Keep client payloads limited to the selected day and requested metrics.
- Cancel or ignore obsolete client requests if interactive refetching is introduced.
- Measure before optimizing; consider network payload, server latency, JavaScript bundle size, React render cost, and chart rendering separately.

## User Interface

### Header and controls

- Product title: `Nordic Power & Weather Explorer`
- Price area: `NO1 East Norway`
- Weather location: `Oslo`
- Today/Tomorrow selector
- Weather metric selector: Wind, Temperature, Solar radiation
- Visible source attribution and freshness information

### Summary cards

Show useful, correctly labeled values such as:

- selected/current-hour spot price
- daily average price
- lowest-price hour
- highest-price hour
- selected weather metric at the selected/current hour

Summary values must be derived from the same validated dataset used by the chart and table.

### Primary visualization

- Spot price: solid area line on the left Y-axis in `NOK/kWh`
- Selected weather metric: dashed line on the right Y-axis with its correct unit
- Axis-triggered crosshair tooltip showing both values for the same timestamp
- Clear legend, axis labels, units, date, and timezone context
- Restrained area fill and no decorative visual noise
- Use dual axes carefully; make the independent scales obvious and never imply direct comparability
- Include this qualification near the chart:

> Oslo weather is shown as a representative location within NO1. Visual relationships are exploratory and do not demonstrate causation.

### Insights

Generate only deterministic, factual observations from the displayed data, for example:

- the hour containing the minimum or maximum value
- whether the evening period is higher or lower than the daily average
- when the selected weather metric peaks

Do not generate causal explanations or use an LLM to infer market behavior.

### Accessible data view

Provide an expandable data table containing timestamp, spot price, selected weather value, and units. Also provide a concise text summary so the chart is not the only way to understand the result.

## Responsive Design and Styling

- Use relative units such as `rem`, `%`, `min()`, `max()`, and `clamp()` for typography and layout where appropriate.
- Avoid fixed pixel heights for content containers and charts when they would break text zoom or small screens.
- Start with a usable mobile layout and progressively enhance it for larger screens.
- Keep controls operable at 200% browser zoom and at narrow viewport widths.
- Use design tokens/CSS variables for color, spacing, radii, shadows, and typography.
- Match existing Figma/design-system values when available; do not invent a parallel token system.

## Accessibility and Universal Design

Target WCAG 2.2 AA.

- Use semantic headings, landmarks, buttons, labels, and tables.
- Make every control keyboard accessible with a visible focus indicator.
- Do not rely on color, line style, position, or icons alone to convey meaning.
- Use a color-blind-friendly palette with sufficient text and non-text contrast.
- Give chart controls accessible names and expose the chart's purpose in surrounding text.
- Ensure status and error messages are understandable; use live announcements only when they provide real value and do not become noisy.
- Respect `prefers-reduced-motion`.
- Format numbers and dates for the intended locale while keeping units explicit.
- Test keyboard navigation, screen-reader-friendly structure, responsive reflow, and zoom—not just automated accessibility checks.

ECharts canvas content is not a complete accessible experience by itself. The text summary and data table are required alternatives.

## Testing and Quality Gates

Follow the repository's configured tools. For a new setup, prefer Vitest plus React Testing Library for unit/component tests and Playwright for a small number of critical browser checks.

Test at minimum:

- provider response parsing and validation
- timezone-aware timestamp alignment
- missing, malformed, and unequal-length weather arrays
- price/weather partial-success behavior
- tomorrow-prices-not-yet-published state
- summary calculations and deterministic insights
- URL parameter parsing and fallback values
- keyboard operation of date/metric controls and data-table disclosure
- responsive rendering of the main workflow

Before completion, all applicable commands must pass:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use the actual package-manager and script names from `package.json`; do not create duplicate scripts merely to match these examples. Do not weaken TypeScript, lint, test, or accessibility rules to make a check pass.

## Code Quality

- Prefer small, focused functions and components with clear names.
- Keep provider adapters, domain calculations, and formatting separate.
- Add comments for important domain assumptions and non-obvious trade-offs, not for self-evident syntax.
- Remove dead code, debugging output, unused exports, and placeholder copy.
- Avoid premature abstractions, generic factories, or layers used only once.
- Handle errors intentionally; do not swallow exceptions.
- Keep units in names or types when ambiguity could create a domain error.

## Definition of Done

A change is complete only when:

- it stays within the agreed one-page scope
- API data is validated and timezone-aligned
- the interface handles loading, empty, partial, stale, and error states
- charts include correct labels, units, provenance, and non-causal wording
- the same trusted dataset drives cards, chart, insights, and table
- responsive behavior, keyboard use, and zoom have been manually checked
- tests, lint, strict type checking, and production build pass
- dependencies and final diff have been reviewed
- documentation is updated when architecture or domain assumptions change

## Interview-Demo Principle

This prototype should demonstrate thoughtful decisions, not artificial complexity. When presenting it, explain the user problem, the API differences, timestamp alignment, feature boundaries, accessibility alternatives, failure handling, and the trade-offs behind caching and visualization choices.
