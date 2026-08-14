"use server";

import { redirect } from "next/navigation";
import { getDashboardPassword } from "@/shared/config/server";
import { isCorrectPassword } from "../utils/session-token";
import { createSession, destroySession } from "./session";

export interface LoginState {
  error?: string;
}

/**
 * One failure message for both empty and wrong: distinguishing them would confirm to a
 * guesser that they are probing the right field. `redirect()` throws, so it must stay
 * outside any try/catch, or the navigation is swallowed with a session already set.
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
