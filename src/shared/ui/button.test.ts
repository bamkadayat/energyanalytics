import { describe, expect, it } from "vitest";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "inverse",
  "ghost-inverse",
];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

describe("buttonClasses", () => {
  it("uses rounded-pill for every variant and size", () => {
    // The rule this module exists to enforce. Buttons previously drifted between
    // rounded-pill and rounded-control because each was styled where it was used.
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        expect(buttonClasses({ variant, size })).toContain("rounded-pill");
      }
    }
  });

  it("never emits another radius", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const classes = buttonClasses({ variant, size });
        expect(classes).not.toMatch(/\brounded-(?:control|card|none)\b/);
      }
    }
  });

  it("keeps the radius even when extra classes are passed", () => {
    expect(buttonClasses({ className: "w-full" })).toContain("rounded-pill");
    expect(buttonClasses({ className: "w-full" })).toContain("w-full");
  });

  it("defaults to the primary variant at medium size", () => {
    expect(buttonClasses()).toBe(buttonClasses({ variant: "primary", size: "md" }));
  });

  it("carries a disabled treatment on every variant", () => {
    // Otherwise a disabled primary button still looks pressable.
    for (const variant of VARIANTS) {
      expect(buttonClasses({ variant })).toContain("disabled:bg-disabled");
    }
  });

  it("uses only design tokens, never raw colour classes", () => {
    for (const variant of VARIANTS) {
      expect(buttonClasses({ variant })).not.toMatch(
        /\b(?:bg|text|border)-(?:slate|gray|zinc|red|amber|green|blue|white|black)\b/,
      );
    }
  });
});

describe("hover and focus ring", () => {
  it("attaches the shared ring class to every variant", () => {
    for (const variant of VARIANTS) {
      expect(buttonClasses({ variant })).toContain("btn-ring");
    }
  });

  it("gives every variant its own ring colour", () => {
    // A ring is only visible against the surface the button sits on, and those differ
    // per variant — so this cannot be a single shared value.
    for (const variant of VARIANTS) {
      expect(buttonClasses({ variant })).toMatch(/\[--btn-ring-color:var\(--[a-z-]+\)\]/);
    }
  });

  it("inverts the fill on hover for the inverse variant", () => {
    // Its ring is white; without inverting, a white ring around a white pill on the
    // navy hero would be invisible.
    const classes = buttonClasses({ variant: "inverse" });

    expect(classes).toContain("hover:bg-surface-inverse");
    expect(classes).toContain("hover:text-fg-inverse");
    expect(classes).toContain("[--btn-ring-color:var(--fg-inverse)]");
  });
});
