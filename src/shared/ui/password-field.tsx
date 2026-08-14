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

/** A password field that can reveal itself. Owns the visibility state, so it needs no wiring. */
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
            Bare text, not a chip — a second boxed control inside the field competes with
            the submit button. It keeps its own `focus-visible` ring: the shell's
            `focus-within` glow says "the field is focused", not "this is".
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
