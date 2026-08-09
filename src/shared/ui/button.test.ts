import { describe, expect, it } from "vitest";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "outline", "inverse"];
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
