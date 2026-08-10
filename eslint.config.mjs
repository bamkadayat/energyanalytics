import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Design-token guard.
 *
 * src/app/globals.css clears Tailwind's default palette, so an off-palette class like
 * `bg-zinc-50` generates no CSS — it fails silently and the page just looks subtly wrong.
 * These rules turn that silent failure into a lint error.
 *
 * See context/ui-tokens.md for the available tokens and context/ui-rules.md for usage.
 */
const HEX_COLOR = String.raw`#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])`;

const COLOR_FUNCTION = String.raw`\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(`;

const TAILWIND_PALETTE = String.raw`\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|accent|caret|shadow|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?\b`;

const tokenGuard = [
  {
    pattern: HEX_COLOR,
    message:
      "Hard-coded hex color. Use a design token — a utility class (bg-surface, text-fg-muted) or var(--token). Add the token to src/app/globals.css and context/ui-tokens.md if it is missing.",
  },
  {
    pattern: COLOR_FUNCTION,
    message:
      "Hard-coded color function. Use a design token from src/app/globals.css instead. Chart code should resolve tokens with getComputedStyle rather than inlining values.",
  },
  {
    pattern: TAILWIND_PALETTE,
    message:
      "Raw Tailwind color class. The default palette is cleared, so this generates no CSS. Use a semantic utility (bg-surface, text-fg-muted, border-line) — see context/ui-tokens.md.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...tokenGuard.flatMap(({ pattern, message }) => [
          { selector: `Literal[value=/${pattern}/]`, message },
          { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
        ]),
      ],
    },
  },
  {
    // This file necessarily contains the patterns it forbids.
    files: ["eslint.config.mjs"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    /*
     * Open Graph images are rasterised by Satori, which has no stylesheet and therefore
     * nothing for `var(--token)` to resolve against — the values have to be literals.
     *
     * The guard above exists because a bad colour class fails *silently* under a cleared
     * Tailwind palette. That reasoning does not reach here: this file emits no classes,
     * and a wrong value is visible in the generated image. The trade is real drift risk,
     * so the palette is confined to one commented block at the top of the file.
     */
    files: ["src/app/**/opengraph-image.tsx", "src/app/**/twitter-image.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
