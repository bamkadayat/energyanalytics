"use server";

import { redirect } from "next/navigation";
import { getDashboardPassword } from "@/shared/config/server";
import { isCorrectPassword } from "../utils/session-token";
import { createSession, destroySession } from "./session";

export interface LoginState {
  error?: string;
}

/**
 * Verifies the shared password and starts a session.
 *
 * The failure message is deliberately the same for an empty and a wrong password. There
 * is one credential here, so a message like "password required" versus "incorrect
 * password" would only confirm to a guesser that they are probing the right field.
 *
 * `redirect()` works by throwing, so it must stay outside any try/catch — catching it
 * would swallow the navigation and leave the user on the form with a session already
 * set.
 */
export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const submitted = formData.get("password");

  if (!isCorrectPassword(getDashboardPassword(), submitted)) {
    return { error: "That password is not correct." };
  }

  await createSession();

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
