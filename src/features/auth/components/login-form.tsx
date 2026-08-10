"use client";

import { useActionState, useId, useState } from "react";
import { FiLock } from "react-icons/fi";
import { Button } from "@/shared/ui";
import { login, type LoginState } from "../api/actions";

const INITIAL: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);
  const [visible, setVisible] = useState(false);
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fieldId}
          className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-fg-inverse-muted"
        >
          Dashboard password
        </label>

        {/*
          The edge of a field is not decoration — it is what says "type here". So it uses
          the interactive line token rather than the hairline one, and gets the taller
          padding of something you aim at.
        */}
        <div className="flex items-center gap-2 rounded-control border border-line-inverse-strong bg-surface-inverse px-3 py-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg-inverse">
          <FiLock aria-hidden="true" className="size-4 shrink-0 text-fg-inverse-muted" />

          <input
            id={fieldId}
            name="password"
            type={visible ? "text" : "password"}
            required
            autoComplete="current-password"
            autoFocus
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : undefined}
            // The field owns the focus ring via focus-within on its wrapper, so the
            // input's own outline would draw a second ring inside the first.
            className="min-w-0 flex-1 bg-transparent text-fg-inverse outline-none placeholder:text-fg-inverse-muted"
          />

          {/*
            A real toggle, not an icon that guesses. `aria-pressed` states which way it is
            set, and the visible word says what pressing it does — the two are different
            questions and both get an answer.
          */}
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-controls={fieldId}
            className="shrink-0 rounded-control border border-line-inverse-strong px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-fg-inverse-muted hover:border-fg-inverse hover:text-fg-inverse"
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        {state.error ? (
          /*
           * role="alert" is warranted: the message appears in response to a deliberate
           * action, and a screen-reader user would otherwise have no idea it failed.
           */
          <p id={errorId} role="alert" className="text-sm text-error-surface">
            {state.error}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        variant="inverse"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Logging in…" : "Login"}
      </Button>
    </form>
  );
}
