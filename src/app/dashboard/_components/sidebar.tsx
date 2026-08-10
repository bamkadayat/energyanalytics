import Link from "next/link";
import { FiBarChart2, FiGrid, FiSun, FiThermometer, FiWind } from "react-icons/fi";
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
 * Every entry is a **real filter**, not navigation to pages that do not exist. A rail of
 * dead links would look like a dashboard and behave like a mock-up; these change the
 * data, and each is a plain link so the whole thing works before any JavaScript loads.
 *
 * Hidden below `lg`, where the horizontal toolbar in the header takes over — a fixed rail
 * on a phone costs more width than the charts can spare.
 */
export function DashboardSidebar({ params }: { params: ViewParams }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="border-b border-line px-4 py-4">
        <Wordmark />
      </div>

      <nav aria-label="Dashboard filters" className="flex flex-col gap-6 overflow-y-auto p-4">
        <Group label="Day">
          {DAYS.map((day) => (
            <RailLink
              key={day.value}
              href={hrefWith(params, { day: day.value })}
              selected={params.day === day.value}
              Icon={FiBarChart2}
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
          <RailLink href="#day-view" selected={false} Icon={FiBarChart2} label="Hour by hour" />
          <RailLink href="#range-heading" selected={false} Icon={FiGrid} label="Range views" />
        </Group>
      </nav>
    </aside>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-2 pb-1 font-mono text-[0.6875rem] uppercase tracking-wider text-fg-muted">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

function RailLink({
  href,
  selected,
  Icon,
  label,
}: {
  href: string;
  selected: boolean;
  Icon: typeof FiWind;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        // Selection carries a background and a left marker, not colour alone.
        className={
          selected
            ? "flex items-center gap-2.5 rounded-control border-l-2 border-line-selected bg-surface-selected px-2.5 py-2 text-sm font-medium text-fg"
            : "flex items-center gap-2.5 rounded-control border-l-2 border-surface px-2.5 py-2 text-sm text-fg-secondary hover:bg-surface-subtle"
        }
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </Link>
    </li>
  );
}
