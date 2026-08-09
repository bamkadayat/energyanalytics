/**
 * Public API of the auth feature.
 *
 * The session module and the secret reader are **not** exported. Both are server-only,
 * and re-exporting them through a barrel that a client component might import is exactly
 * how a secret ends up in a browser bundle. Import them by path from server code.
 */
export { LoginForm } from "./components/login-form";
export { logout } from "./api/actions";
export type { LoginState } from "./api/actions";
