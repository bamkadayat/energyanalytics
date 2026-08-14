"use client";

import { useId, type ReactNode } from "react";

/**
 * Wiring a `Field` generates for its control. Spread it: `<input {...control} />`.
 *
 * A render prop rather than plain children because the label's `htmlFor`, the error's
 * `id` and the input's `aria-describedby` must agree on an id `Field` owns.
 */
export interface FieldControl {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

/** `md` for primary form controls, `sm` for dense chrome like a table toolbar. */
export type FieldSize = "sm" | "md";

const SIZES: Record<FieldSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2.5",
};

export interface FieldProps {
  /** Visible label. Always present — a placeholder is not a label. */
  label: string;
  size?: FieldSize;
  /** Its presence also marks the control invalid, so the two cannot disagree. */
  error?: string;
  /** The input, plus any icon or trailing control inside the field's border. */
  children: (control: FieldControl) => ReactNode;
}

/** For the bare input: the shell owns the border, padding and focus ring. */
export const fieldInputClasses =
  "min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-muted";

/** Labelled text field: label above, bordered shell, error below. */
export function Field({ label, size = "md", error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-fg-secondary">
        {label}
      </label>

      {/*
        `border-line-strong`, not the hairline `--line`: a control's edge must clear 3:1
        to be a boundary. The ring sits here so it surrounds icons and trailing buttons
        too, not just the text box.
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
        <p id={errorId} role="alert" className="text-sm text-error-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
