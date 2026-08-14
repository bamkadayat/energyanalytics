# Nordic Power & Weather Explorer

Norwegian day-ahead electricity prices for **NO1 (East Norway)** shown against hourly Oslo
weather, hour by hour in Europe/Oslo time.

Electricity in the Nordics is priced hourly, a day ahead, and the price moves with the
weather — wind pushes it down, cold pushes it up. The two facts live in two unrelated
public APIs with different shapes, different units and different notions of a "day". This
app joins them and lets you read the result.

It is an **exploratory visualization**. It can show that price and weather moved together
at a given hour. It never claims one caused the other, and a test enforces the absence of
causal vocabulary anywhere in the generated text.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict · Tailwind v4 ·
ECharts · TanStack Table + Virtual · Vitest.

## Running it

```bash
pnpm install
cp .env.example .env.local   # then fill in AUTH_SECRET and DASHBOARD_PASSWORD
pnpm dev
```

| Script | |
| --- | --- |
| `pnpm dev` | http://localhost:3000 |
| `pnpm build` | production build — the full gate, TypeScript included |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | eslint |
| `pnpm test` | vitest |

`.next/types` is generated, so a cold clone type-errors until `pnpm dev` or `pnpm build`
has run once.

### Environment

`AUTH_SECRET` (32+ chars) signs the session cookie; `DASHBOARD_PASSWORD` is the single
shared password. `DEMO_PASSWORD_HINT` is optional and prints the password on the login
page — deliberately a *second* variable, so no deployment can publish its own credential
by not knowing the feature exists.

## Architecture

```
src/
  app/            routes only — composition, no domain logic
    dashboard/    the day view, range views, and /dashboard/hours
    login/
  features/
    energy-prices/      provider → validated EnergyPrice
    weather-forecast/   provider → validated HourlyWeather
    market-correlation/ owns no provider; joins the two above
    auth/
  shared/         config, formatting and date utilities, UI primitives
```

Each feature exposes a barrel and forbids deep imports. `market-correlation` composes the
other two into **one aligned dataset**, and the chart, the KPI cards, the observations and
the table all read from that single derivation — so a card cannot disagree with the graph
beside it.

Raw provider shapes never cross a feature boundary. Only validated domain types do.

## Decisions worth explaining

**The join key is a normalised hour, never an array index.** The two providers are
independent: they start at different hours, cover different spans, drop hours, and return
23 or 25 of them across a DST transition. Index-joining survives none of that — it would
pair 03:00 prices with 02:00 weather and produce a chart that looks entirely reasonable
while being wrong. This is the most dangerous available bug in the project, so the key is
derived from the timestamp itself. The result is the *union* of both sources' hours, not
the intersection: a one-sided hour is a real gap, and dropping it would hide missing data
behind a shorter chart.

**A category axis with pre-formatted labels, not a time axis.** An ECharts time axis
formats ticks in the *browser's* timezone, so a reader in London would see Norwegian
market hours relabelled into their own clock while the values stayed put. Formatting on
the server against Europe/Oslo keeps the hours identical for everyone.

**Nothing outside `shared/lib/oslo-day.ts` may touch a date.** No `new Date()` on a naive
string, no `getHours()` on a plain Date, no assuming a day is 24 hours — all three quietly
depend on the server's zone. Day arithmetic walks the calendar rather than adding
86,400,000 ms, or it lands on the wrong date twice a year.

**"Not published yet" is an outcome, not an error.** Tomorrow's prices clear around 13:00
Europe/Oslo; before that the provider answers 404. That is the system working. It gets its
own result arm, its own UI, and its own cache lifetime — `pricesPending` is minutes, where
settled prices are hours, because caching a miss for hours would hide prices that arrive
moments later.

**One cache entry per day, not per range.** The price API is per-day anyway, and per-day
keys mean yesterday stays warm when today is refetched; a range key would evict all 30
days every time the window slid. Weather is the opposite — Open-Meteo serves any span from
one URL — which is why the two fetchers deliberately do not share a shape.

**The heavy views are derived on the server.** 720–2,160 hours become the arrays each
chart actually draws, rather than raw rows for the browser to bucket. `/dashboard/hours`
holds ~2,160 rows with only the visible ~25 mounted, while sorting and filtering still run
over the whole set — sorting a page would answer "the cheapest of the hundred you happen
to be looking at".

**Line style is load-bearing, not decoration.** The chart is two tones of navy, so hue
does not separate the series at all: solid vs dashed does, alongside the separate axis, the
differing units and a text legend in the DOM. The legend's swatches are line samples rather
than dots for exactly this reason — a round swatch would teach the wrong key. Do not
simplify the line styles.

**Virtualization costs a screen reader the table** — rows are absent and the ones present
misstate their position — so `aria-rowcount` and `aria-rowindex` put both back, and the
grid layout the virtualizer needs drops the implicit table roles, so each is written out.

### Next.js 16 specifics worth knowing

- **Middleware is `proxy.ts`.** It runs on Node, so it verifies the session HMAC rather
  than checking a cookie exists — a presence-only check would bounce an expired cookie
  between `/login` and `/dashboard` forever. It is *not* an authorization layer; every
  route re-checks for itself.
- **Cache Components traps, both hit.** A bare `Date.now()` in a server component fails
  the build; it needs `await connection()`, and `<Suspense>` alone does not clear it. And
  a `redirect()` inside a streaming route commits a 200 first and navigates client-side —
  which is why the redirects live in Proxy, where they produce a real 307.

## Accessibility

Targets WCAG 2.2 AA. Nothing relies on colour alone; every chart has a table view carrying
the same numbers; controls stay operable at 200% zoom and at narrow widths. Status
messages carry tone through colour, icon *shape* and text independently, and tests assert
all five tones produce distinct labels and distinct icon shapes.

## Data sources

Prices from [hvakosterstrommen.no](https://www.hvakosterstrommen.no/strompris-api),
weather from [Open-Meteo](https://open-meteo.com/). Both are public and unauthenticated.
Prices exclude VAT, grid charges and other consumer costs, which the UI states wherever
prices appear. Oslo is a single point inside a much larger price area and is always
labelled as representative, never as covering NO1.
