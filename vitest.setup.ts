import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL does not auto-clean when Vitest runs with globals disabled in a worker,
// so unmount explicitly between tests to keep the jsdom document isolated.
afterEach(() => {
  cleanup();
});
