"use client";

import { useState } from "react";
import { Field, fieldInputClasses } from "./field";

export interface PasswordFieldProps {
  /** Form field name — what the server action reads the value out of. */
  name: string;
  label: string;
  /** Error text, forwarded to `Field`, which also derives the invalid state from it. */
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * A password field that can reveal itself.
 *
 * The visibility state lives here rather than in a `useLoginForm` hook on the consumer.
 * Whether the characters are showing is this control's own business — nothing outside it
 * reads or sets that flag — so lifting it into a hook would hand every caller a piece of
 * state to thread through and forget to reset. Owning it makes the component droppable
 * into any form with no wiring at all, which is the reuse a hook would only describe.
 */
export function PasswordField({
  name,
  label,
  error,
  required,
  autoComplete,
  autoFocus,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} error={error}>
      {(control) => (
        <>
          <input
            {...control}
            name={name}
            type={visible ? "text" : "password"}
            required={required}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={fieldInputClasses}
          />

          {/*
            A real toggle, not an icon that guesses. `aria-pressed` states which way it is
            set and the visible word says what pressing it does — different questions, both
            answered.

            Bare text rather than a bordered chip: a second boxed control inside the
            field's own box read as a button competing with the submit, when all it does is
            change how one field renders. It keeps its own `focus-visible` ring, because
            without a border the shell's `focus-within` glow would be the only response to
            tabbing here, and that says "the field is focused", not "this is".
          */}
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-controls={control.id}
            className="shrink-0 text-sm text-fg-muted underline underline-offset-4 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {visible ? "Hide" : "Show"}
          </button>
        </>
      )}
    </Field>
  );
}
