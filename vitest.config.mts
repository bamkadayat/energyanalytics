import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    // No globals: tests import describe/it/expect explicitly, so tsconfig needs no
    // "types" override (which would otherwise shadow the default @types resolution).
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      // Mirrors the "@/*" -> "./src/*" mapping in tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
