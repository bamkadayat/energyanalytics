import Link from "next/link";
import { hrefWith, type ViewParams } from "@/features/market-correlation/client";
import {
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
export function RailContent({ params }: { params: ViewParams }) {
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
        {/* In-page anchors, so a long dashboard stays navigable without scrolling. */}
        <RailLink href="#day-view" label="Hour by hour" />
        {/* The badge is live data — the range currently loaded — not decoration. */}
        <RailLink href="#range-heading" label="Range views" badge={`${params.range}d`} />
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
        aria-current={selected ? "page" : undefined}
        className={
          selected
            ? "flex items-center gap-3 rounded-control bg-surface-rail-active px-3 py-2 text-sm font-medium text-fg-inverse"
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
}: {
  href: string;
  label: string;
  badge?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-inverse-muted hover:bg-surface-rail-active hover:text-fg-inverse"
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
