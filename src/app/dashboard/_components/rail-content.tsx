import Link from "next/link";
import { hrefWith, type ViewParams } from "@/features/market-correlation/client";
import {
  HOURS_TABLE_DAYS,
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type WeatherMetricId,
} from "@/shared/config";

/**
 * The rail's filter list, shared by the desktop sidebar and the mobile drawer.
 *
 * Extracted so the two cannot drift: a phone showing a different set of filters from the
 * desktop is the kind of divergence that only surfaces in a demo.
 *
 * No hooks, so it renders as a server component inside the sidebar and as part of the
 * client drawer without needing two versions.
 *
 * The day is **not** here. It used to be, alongside a copy in the chart toolbar, which
 * meant two controls for one piece of state and two places to look when the wrong day was
 * showing. It now lives in the header, once.
 */
export interface RailContentProps {
  params: ViewParams;
  /** Which route is showing, so the one entry that is a route can be marked current. */
  active?: "day" | "hours";
}

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
        {/*
          Anchors carry `/dashboard` in front of the hash, not just `#day-view`. From
          `/dashboard/hours` a bare hash would look for an element on the page you are
          already on and do nothing.
        */}
        <RailLink href={`/dashboard${hrefWith(params, {})}#day-view`} label="Hour by hour" />
        {/* The badge is live data — the range currently loaded — not decoration. */}
        <RailLink
          href={`/dashboard${hrefWith(params, {})}#range-heading`}
          label="Range views"
          badge={`${params.range}d`}
        />
        {/*
          A route, not an anchor: the only entry in the rail that leaves the page. Its
          badge is the span it loads, so the two range entries read on the same scale.
        */}
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
      <p className="px-3 pb-2 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-inverse-muted">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

/**
 * A metric, carrying the colour it is drawn in.
 *
 * The swatch replaced a generic icon: a thermometer beside "Temperature" repeats the
 * word, where the swatch says something the label cannot — which line in the chart is
 * this one. Selection is still fill plus weight, never the swatch, which is present on
 * every row.
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
         * Selected and hover must not look alike. The active fill is only 1.19:1 against
         * the rail, so on its own it barely registers — and it was also the hover fill,
         * which left an unselected row under the cursor looking like the selected one.
         * Selection now adds an inset ring in `--line-inverse-strong` (3.3:1 against the
         * rail), and hover is the fill alone.
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
