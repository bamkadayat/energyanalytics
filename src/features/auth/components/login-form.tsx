"use client";

import { useActionState } from "react";
import { Button, PasswordField } from "@/shared/ui";
import { login, type LoginState } from "../api/actions";

const INITIAL: LoginState = {};

/**
 * The login form: one field, one action.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <PasswordField
        name="password"
        label="Password"
        error={state.error}
        required
        autoComplete="current-password"
        autoFocus
        placeholder="••••••••••"
      />

      <Button
        type="submit"
        size="lg"
        variant="primary-soft"
        radius="tight"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
