import Link from "next/link";
import {
  FiActivity,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiSun,
  FiThermometer,
  FiWind,
} from "react-icons/fi";
import { logout } from "@/features/auth";
import { hrefWith, type ViewParams } from "@/features/market-correlation";
import {
  WEATHER_METRICS,
  WEATHER_METRIC_IDS,
  type DaySelection,
  type WeatherMetricId,
} from "@/shared/config";
import { Wordmark } from "@/shared/ui";

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
 * The application rail.
 *
 * Every entry is a **real filter or a real anchor**. A rail of links to pages that do not
 * exist would look like a dashboard and behave like a mock-up — the same reason the
 * landing cards open filtered dashboard views instead of a "Read more" going nowhere.
 *
 * There is deliberately no search field. The reference design has one, but this app has a
 * single dataset and nothing to search; a box that accepts typing and does nothing is a
 * worse lie than an absent feature.
 *
 * Hidden below `lg`, where the horizontal toolbar in the header takes over — a fixed
 * 240px rail on a phone costs more width than the charts can spare.
 */
export function DashboardSidebar({ params }: { params: ViewParams }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="px-4 py-4">
        <Wordmark />
      </div>

      <nav
        aria-label="Dashboard filters"
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4"
      >
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
          {/* The badge is live data, not decoration: it is the range currently loaded. */}
          <RailLink
            href="#range-heading"
            Icon={FiGrid}
            label="Range views"
            badge={`${params.range}d`}
          />
        </Group>
      </nav>

      {/*
        Pinned to the bottom behind a divider, as in the reference. Logout lives here
        rather than in the header: it is used once a session and does not deserve prime
        space next to the data.
      */}
      <div className="border-t border-line px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle hover:text-fg"
          >
            <FiLogOut aria-hidden="true" className="size-5 shrink-0" />
            Logout
          </button>
        </form>
      </div>
    </aside>
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
        /*
         * Active state is a soft fill *and* a weight change. The fill alone would be
         * colour carrying meaning on its own; the heavier label is the second channel.
         */
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
