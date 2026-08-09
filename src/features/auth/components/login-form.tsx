"use client";

import { useActionState } from "react";
import { FiLock } from "react-icons/fi";
import { Button } from "@/shared/ui";
import { login, type LoginState } from "../api/actions";

const INITIAL: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {/*
          Visually hidden rather than removed. The reference puts the label in the
          placeholder, but a placeholder disappears the moment you type and is not a
          label at all to assistive technology.
        */}
        <label htmlFor="password" className="sr-only">
          Dashboard password
        </label>

        <div className="relative">
          <FiLock
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
          />

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Dashboard password"
            required
            autoComplete="current-password"
            autoFocus
            // Points assistive technology at the message below when it appears, instead
            // of leaving the field merely red.
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "password-error" : undefined}
            // pl-10 clears the icon; the icon is pointer-events-none so clicking it
            // still focuses the field.
            className="w-full rounded-control border border-line bg-surface-subtle py-2.5 pl-10 pr-3 text-fg placeholder:text-fg-muted"
          />
        </div>

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

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Login"}
      </Button>
    </form>
  );
}
