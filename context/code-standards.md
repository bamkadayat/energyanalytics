# Code Standards

Conventions for writing code in this repo. Structural rules (what may import what, where
files live) are in `architecture.md`; this is about the code itself.

---

## TypeScript

- `strict` is on and stays on. Never weaken a compiler, lint, or accessibility setting to
  make a check pass.
- **No `any`.** Use `unknown` at untrusted boundaries and narrow it deliberately. The
  provider parse step is the only place narrowing happens.
- Explicit return types on everything a feature's `index.ts` exports. Inference is fine
  for locals and internal helpers.
- Model mutually exclusive states as **discriminated unions**, not optional-field soup:

  ```ts
  type PriceResult =
    | { status: "ok"; prices: EnergyPrice[] }
    | { status: "not-published"; day: OsloDay }
    | { status: "error"; reason: ProviderErrorReason };
  ```

  A union makes the impossible state unrepresentable and forces the UI to handle each arm.
- `type` for unions and object shapes; `interface` only when declaration merging is
  actually wanted.
- Keep raw provider types (`RawEnergyPrice`, `RawHourlyWeather`) separate from domain
  types. Never let a raw type reach a component.

## Naming

- **Units belong in the name or the type** wherever a bare number is ambiguous:
  `nokPerKwh`, `windSpeedMs`, `temperatureC`, `radiationWm2`. This project runs three
  units across two axes; an unlabelled `value` is a latent domain bug.
- Timestamps say what they are: `hourStartOslo`, not `time`.
- `Raw*` prefix for provider shapes. No prefix for domain types.
- Functions are verbs (`alignByHour`, `parsePrices`), booleans read as assertions
  (`isPublished`, `hasGaps`).

## Modules

- Cross-feature imports go through the feature's `index.ts`. No deep imports. Ever.
- Named exports everywhere, with one exception: Next requires **default** exports for
  `page.tsx`, `layout.tsx`, `error.tsx`, and friends.
- One primary export per file, named to match the file.
- Barrels stay deliberate — the public contract, not a re-export of everything.

## Functions and components

- Small and single-purpose. If a function needs a paragraph to explain, split it.
- Keep provider adapters, domain calculations, and formatting in **separate** functions.
  A function that fetches, normalizes, and formats is three functions.
- Alignment, aggregation, and insight logic are **pure functions in `utils/`** — no
  React, no network, no clock. Pass the current time in as an argument so it is testable.
- Components receive narrow props and render. No business logic, no fetch calls.
- Server components by default; `"use client"` only on interactive leaves.
- **No effect that synchronizes derived state.** If a value is a pure function of props,
  compute it during render.
- `useMemo`/`memo` only when measurement or data size justifies it, not preemptively.

## Errors

- Handle intentionally; never swallow. An empty `catch` is a defect.
- Convert provider failures into controlled domain errors at the boundary. A fetch
  rejection must never surface as an unhandled 500.
- Use request timeouts on every external call.
- **Never fabricate fallback market or weather values.** Missing stays missing; a gap is
  not a zero. Mock data belongs in tests or an explicitly labelled demo mode.
- Partial success is a normal result, not an error path.

## Comments

- Comment domain assumptions and non-obvious trade-offs: why prices for tomorrow are
  cached differently, why alignment joins on timestamp rather than index.
- Do not comment self-evident syntax.
- Delete dead code, debug output, unused exports, and placeholder copy rather than
  commenting them out.

## Testing

- Colocate tests with the code they cover, `*.test.ts(x)`.
- Test behavior at boundaries, not implementation details.
- Minimum coverage is enumerated in `project-overview.md` — provider parsing, timezone
  alignment, malformed/unequal-length arrays, partial success, the not-yet-published
  state, summary and insight calculations, URL param parsing, keyboard operation, and
  responsive rendering of the main flow.
- Any bug that reaches the UI gets a regression test at the utility level.

## Before calling anything done

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Tests join this list once a runner is installed (`build-plan.md`). Use the repo's real
script names — do not add duplicate scripts to match a convention from elsewhere.

Review your own diff before handing it over. AI-generated code is a draft; the author is
responsible for understanding, testing, and validating every line of it.
