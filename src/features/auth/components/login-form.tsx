"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui";
import { login, type LoginState } from "../api/actions";

const INITIAL: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-fg">
          Dashboard password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          // Points assistive technology at the message below when it appears, instead of
          // leaving the field merely red.
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
          className="rounded-control border border-line-strong bg-surface px-3 py-2 text-fg"
        />

        {state.error ? (
          /*
           * role="alert" is warranted here: the message appears in response to a
           * deliberate action and a screen-reader user would otherwise have no idea the
           * submission failed.
           */
          <p id="password-error" role="alert" className="text-sm text-error-fg">
            {state.error}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
