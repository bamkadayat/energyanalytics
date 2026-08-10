/**
 * The engineering decisions, stated plainly.
 *
 * This page is read by people evaluating the work as much as by people wanting the
 * numbers, and the interesting part of this project is not that it draws a chart — it is
 * the handful of decisions underneath. Each item is a claim that can be checked against
 * the repository, not a capability list.
 *
 * No colour. The restraint pass established that colour on these pages encodes data, and
 * this section has none, so it stays navy and slate like the rest of the chrome.
 */

/**
 * Headings are kept under ~30 characters so none wraps at `lg`.
 *
 * That is a layout constraint, not a style preference: the four items sit in a plain
 * grid, so a heading that takes two lines in one column pushes that column's body a line
 * below its neighbours' and the row stops reading as a row. "Joined on the hour, never by
 * index" did exactly that — the qualifier moved into the body, where it has room.
 *
 * Bodies are held to roughly the same length for the same reason: at four columns the
 * measure is ~30 characters, and the earlier 40-word entries set as a ragged wall.
 */
const DECISIONS = [
  {
    title: "Joined on the hour",
    body: "Matched on a normalised timestamp, never on array position — a day with a clock change has 23 or 25 hours.",
  },
  {
    title: "A gap stays a gap",
    body: "A missing reading is never repaired into a zero. It breaks the line, and it is counted in the coverage figure.",
  },
  {
    title: "Derived on the server",
    body: "Up to 1,440 hours arrive as arrays of numbers. The client never parses a timestamp or buckets a range.",
  },
  {
    title: "Readable without the chart",
    body: "Every figure is also a sortable table and a text summary. Price is solid, weather dashed — never colour alone.",
  },
] as const;

export function HowItsBuilt() {
  return (
    <section className="border-y border-line bg-surface py-16 sm:py-24">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance text-display font-semibold text-fg">
            How it&rsquo;s built
          </h2>

          <p className="text-pretty text-fg-secondary">
            Two public APIs that disagree about shape, timezone and availability. Most of
            the work is in the reconciling, so here is what it does with the awkward cases.
          </p>
        </div>

        {/*
          Two columns before four: at four on a tablet each item is a word wide and the
          body sets as a ladder.
        */}
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {DECISIONS.map(({ title, body }, index) => (
            <li key={title} className="flex flex-col gap-3">
              {/*
                A counted index, in the same mono eyebrow used across the dashboard. It
                gives the row a rhythm and an entry point — without it these were four
                grey blocks under a hairline, with nothing to catch the eye and no signal
                that they are a set meant to be read in order.

                `aria-hidden`: the number is a visual anchor, not content. A screen reader
                already gets the ordinal from the list.
              */}
              <span
                aria-hidden="true"
                /*
                  `tracking-wider`, not the eyebrow's `0.18em`. That tracking is tuned for
                  uppercase words; on a two-character number it opens a gap wide enough
                  that "01" reads as "0 1" — two glyphs rather than one figure.
                */
                className="border-t border-line-strong pt-4 font-mono text-xs tracking-wider text-fg-muted"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="text-pretty text-base font-semibold text-fg">{title}</h3>

              {/*
                `--fg-secondary` is the body-copy token; `--fg-muted` is for labels, units
                and captions. This is body copy.
              */}
              <p className="text-pretty text-sm leading-relaxed text-fg-secondary">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
