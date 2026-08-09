import type { Insight } from "../utils/derive-insights";

/**
 * Plain restatements of what the data says.
 *
 * Rendered as a list rather than prose because each item is independent — a reader
 * scanning for the cheapest hour should not have to read a paragraph.
 */
export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="observations-heading" className="flex flex-col gap-3">
      <h3 id="observations-heading" className="text-sm font-medium text-fg">
        Observations
      </h3>

      <ul className="flex flex-col gap-2">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="border-l-2 border-line-selected pl-3 text-sm text-fg-secondary"
          >
            {insight.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
