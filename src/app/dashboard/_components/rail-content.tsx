import Link from "next/link";
import {
  FiActivity,
  FiCalendar,
  FiGrid,
  FiSun,
  FiThermometer,
  FiWind,
} from "react-icons/fi";
import { hrefWith, type ViewParams } from "@/features/market-correlation/client";
import {
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type DaySelection,
  type WeatherMetricId,
} from "@/shared/config";

const METRIC_ICONS: Record<WeatherMetricId, typeof FiWind> = {
  wind: FiWind,
  temperature: FiThermometer,
  solar: FiSun,
};

const DAYS: ReadonlyArray<{ value: DaySelection; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

/**
 * The rail's filter list, shared by the desktop sidebar and the mobile drawer.
 *
 * Extracted so the two cannot drift: a phone showing a different set of filters from the
 * desktop is the kind of divergence that only surfaces in a demo.
 *
 * No hooks, so it renders as a server component inside the sidebar and as part of the
 * client drawer without needing two versions.
 */
export function RailContent({ params }: { params: ViewParams }) {
  return (
    <>
      <Group label="Day">
        {DAYS.map((day) => (
          <RailLink
            key={day.value}
            href={hrefWith(params, { day: day.value })}
            selected={params.day === day.value}
            Icon={FiCalendar}
            label={day.label}
          />
        ))}
      </Group>

      <Group label="Weather metric">
        {WEATHER_METRIC_IDS.map((id) => (
          <RailLink
            key={id}
            href={hrefWith(params, { metric: id })}
            selected={params.metric === id}
            Icon={METRIC_ICONS[id]}
            label={WEATHER_METRICS[id].label}
          />
        ))}
      </Group>

      <Group label="Jump to">
        {/* In-page anchors, so a long dashboard stays navigable without scrolling. */}
        <RailLink href="#day-view" Icon={FiActivity} label="Hour by hour" />
        {/* The badge is live data — the range currently loaded — not decoration. */}
        <RailLink
          href="#range-heading"
          Icon={FiGrid}
          label="Range views"
          badge={`${params.range}d`}
        />
      </Group>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 font-mono text-[0.6875rem] uppercase tracking-wider text-fg-muted">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

function RailLink({
  href,
  selected = false,
  Icon,
  label,
  badge,
}: {
  href: string;
  selected?: boolean;
  Icon: typeof FiWind;
  label: string;
  badge?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        // Fill plus weight: a background tint alone would be colour carrying meaning.
        className={
          selected
            ? "flex items-center gap-3 rounded-control bg-surface-subtle px-3 py-2 text-sm font-medium text-fg"
            : "flex items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle hover:text-fg"
        }
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {badge ? (
          <span className="rounded-pill border border-line px-2 py-0.5 font-mono text-[0.6875rem] text-fg-muted">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
