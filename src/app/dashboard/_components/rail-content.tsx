import Link from "next/link";
import { hrefWith, type ViewParams } from "@/features/market-correlation/client";
import {
  HOURS_TABLE_DAYS,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type WeatherMetricId,
} from "@/shared/config";

/**
 * The rail's filter list, shared by the desktop sidebar and the mobile drawer, so the two
 * cannot drift. No hooks, so it renders in a server component and a client one alike.
 *
 * The day is not here — it lives in the header, once.
 */
export interface RailContentProps {
  params: ViewParams;
  /** Which route is showing, so the one entry that is a route can be marked current. */
  active?: "day" | "hours";
}

/**
 * Entries in the "Views" group below, for the loading skeleton to reserve.
 *
 * Declared beside the list it counts so the two are edited together — the skeleton used
 * to hardcode this, where a fourth view would have left it a row short with nothing to
 * catch it. `shell-skeleton.test.tsx` asserts the count against the rendered rail.
 */
export const RAIL_VIEW_COUNT = 3;

export function RailContent({ params, active = "day" }: RailContentProps) {
  return (
    <>
      <Group label="Weather metric">
        {WEATHER_METRIC_IDS.map((id) => (
          <MetricLink
            key={id}
            href={hrefWith(params, { metric: id })}
            selected={params.metric === id}
            id={id}
          />
        ))}
      </Group>

      <Group label="Views">
        {/* Absolute hrefs: from `/dashboard/hours` a bare `#day-view` would do nothing. */}
        <RailLink href={`/dashboard${hrefWith(params, {})}#day-view`} label="Hour by hour" />
        {/* The badge is live data — the range currently loaded — not decoration. */}
        <RailLink
          href={`/dashboard${hrefWith(params, {})}#range-heading`}
          label="Range views"
          badge={`${params.range}d`}
        />
        {/* A route, not an anchor — the only entry that leaves the page. */}
        <RailLink
          href="/dashboard/hours"
          label="All hours"
          badge={`${HOURS_TABLE_DAYS}d`}
          selected={active === "hours"}
        />
      </Group>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Bigger and bolder than the unit chips, or it reads as one more small label. */}
      <p className="px-3 pb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-fg-inverse">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

/**
 * A metric, carrying the colour it is drawn in. The swatch says what the label cannot —
 * which line in the chart this is. Selection is fill plus weight, never the swatch.
 */
function MetricLink({
  href,
  selected,
  id,
}: {
  href: string;
  selected: boolean;
  id: WeatherMetricId;
}) {
  return (
    <li>
      <Link
        href={href}
        // Swapping the metric redraws the views in place. The anchors below this list are
        // the links that are *meant* to move the page.
        scroll={false}
        aria-current={selected ? "page" : undefined}
        /*
         * The active fill is 1.19:1 against the rail and was also the hover fill, so the
         * two states looked alike. Selection adds a 3.3:1 inset ring; hover is the fill.
         */
        className={
          selected
            ? "flex items-center gap-3 rounded-control bg-surface-rail-active px-3 py-2 text-sm font-medium text-fg-inverse inset-ring inset-ring-line-inverse-strong"
            : "flex items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-inverse-muted hover:bg-surface-rail-active hover:text-fg-inverse"
        }
      >
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-[3px]"
          style={{ backgroundColor: `var(--chart-${id})` }}
        />
        <span className="flex-1 truncate">{WEATHER_METRICS[id].label}</span>
        <span className="shrink-0 rounded-pill border border-line-inverse-strong px-2 py-0.5 font-mono text-[0.625rem] text-fg-inverse-muted">
          {WEATHER_METRICS[id].unit}
        </span>
      </Link>
    </li>
  );
}

function RailLink({
  href,
  label,
  badge,
  selected = false,
}: {
  href: string;
  label: string;
  badge?: string;
  /** Only the entries that are their own route can be current. Anchors never are. */
  selected?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        // Same treatment as a selected metric: fill, ring and weight, never colour alone.
        className={
          selected
            ? "flex items-center gap-3 rounded-control bg-surface-rail-active px-3 py-2 text-sm font-medium text-fg-inverse inset-ring inset-ring-line-inverse-strong"
            : "flex items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-inverse-muted hover:bg-surface-rail-active hover:text-fg-inverse"
        }
      >
        <span className="flex-1 truncate">{label}</span>
        {badge ? (
          <span className="shrink-0 rounded-pill border border-line-inverse-strong px-2 py-0.5 font-mono text-[0.625rem] text-fg-inverse-muted">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
