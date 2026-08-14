"use client";

import { useId, type ReactNode } from "react";

/**
 * The single source of text-field styling, for the same reason `button.tsx` exists.
 *
 * Fields had drifted, because each was styled where it was used: the login password field
 * carried `border-line-strong` with a `focus-within` ring, the hours-table search carried
 * `border-line` with a `focus-visible` one, and `ui-registry.md` records a third, earlier
 * spelling on `bg-surface-subtle`. `ui-rules.md` already reserves `rounded-control` for
 * "controls you type into" but no module owned that rule, so it was re-derived per author.
 *
 * `border-line-strong` is the one that survives, and not by preference: a control's
 * boundary has to clear 3:1 to be a boundary at all, and the hairline `--line` token does
 * not. The search field was under-contrast; unifying fixes it rather than splitting the
 * difference.
 *
 * Client-side because `useId` is. That is the right boundary anyway — a field is an
 * interactive leaf, which is exactly what `code-standards.md` says `"use client"` is for.
 */

/**
 * The wiring a `Field` generates and its control must receive. Spread it onto the input:
 * `<input {...control} />`.
 *
 * This is a render prop rather than a `<Field><input /></Field>` sandwich because the
 * label's `htmlFor`, the error's `id`, and the input's `aria-describedby` have to agree on
 * an identifier that `Field` generates. Passing children as a plain node would leave the
 * caller to re-derive all three — which is the duplication this file exists to remove.
 */
export interface FieldControl {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

/**
 * `md` is a primary control someone came to the page to use. `sm` is a field that lives
 * in dense chrome — a table toolbar, beside checkboxes — where the taller box would
 * outweigh the controls it sits among. Same rationale as `ButtonSize`, and deliberately
 * as few options.
 */
export type FieldSize = "sm" | "md";

const SIZES: Record<FieldSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2.5",
};

export interface FieldProps {
  /** Visible label. Always present — a placeholder is not a label. */
  label: string;
  size?: FieldSize;
  /**
   * Error text. Its presence is also what marks the control invalid, so the two can
   * never disagree.
   */
  error?: string;
  /**
   * Everything inside the bordered shell: the input, plus any icon or trailing control
   * that belongs *within* the field's edge rather than beside it.
   */
  children: (control: FieldControl) => ReactNode;
}

/**
 * Bare input inside a `Field` shell. The shell owns the border, padding and focus ring,
 * so the input contributes no chrome of its own — its outline would draw a second ring
 * inside the first.
 */
export const fieldInputClasses =
  "min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-muted";

/**
 * A labelled text field: label above, bordered shell, error below.
 *
 * Presentational and domain-agnostic — it knows nothing about passwords or search.
 */
export function Field({ label, size = "md", error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      {/*
        Sentence case, not the mono uppercase micro-caps this app uses elsewhere. That
        treatment marks instrument readouts — timestamps, price areas, units. A field
        label is prose, and dressing it as a readout made a form look like a column header.
      */}
      <label htmlFor={id} className="text-sm text-fg-secondary">
        {label}
      </label>

      {/*
        The edge of a field is not decoration — it is what says "type here". Hence the
        interactive line token and the taller padding of something you aim at.

        The ring lives here rather than on the input so it surrounds the whole control,
        icons and trailing buttons included, rather than just the text box inside it.
      */}
      <div
        className={`flex items-center gap-3 rounded-control border border-line-strong bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${SIZES[size]}`}
      >
        {children({
          id,
          "aria-describedby": error ? errorId : undefined,
          "aria-invalid": error ? true : undefined,
        })}
      </div>

      {error ? (
        /*
         * role="alert" is warranted: the message appears in response to a deliberate
         * action, and a screen-reader user would otherwise have no idea it failed.
         *
         * `--error-fg`, its real foreground token — not `--error-surface`, a *background*
         * token that an earlier version pressed into service as text.
         */
        <p id={errorId} role="alert" className="text-sm text-error-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
