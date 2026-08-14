/**
 * Public API of the auth feature. The session module and secret reader are deliberately
 * absent — re-exporting server-only code through a barrel a client may import is how a
 * secret reaches the browser. Import those by path from server code.
 */
export { LoginForm } from "./components/login-form";
export { logout } from "./api/actions";
export type { LoginState } from "./api/actions";
