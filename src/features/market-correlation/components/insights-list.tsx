import type { Insight } from "../utils/derive-insights";

/**
 * Plain restatements of what the data says. A list, not prose — each item is independent.
 * The hour sits in its own column so the times line up and the list stays scannable.
 */
export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="observations-heading" className="flex flex-col gap-1">
      <h3 id="observations-heading" className="pb-3 text-base font-semibold text-fg">
        Observations
      </h3>

      {/* Hairlines between rows, not around each one: four boxes would read as four cards. */}
      <ul className="flex flex-col divide-y divide-line">
        {insights.map((insight) => (
          <li key={insight.id} className="flex items-start gap-3 py-3 first:pt-0">
            {insight.hour ? (
              <span className="shrink-0 rounded-control bg-surface-subtle px-2 py-1 font-mono text-xs tabular-nums text-fg-secondary">
                {insight.hour}
              </span>
            ) : null}

            <p className="text-pretty pt-0.5 text-sm leading-relaxed text-fg-secondary">
              {insight.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
