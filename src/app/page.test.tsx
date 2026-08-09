import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

/*
 * Harness check: proves Vitest + React Testing Library + jsdom render a server
 * component's output and that the "@/" alias and jest-dom matchers are wired up.
 * The scaffold page it targets is replaced in Phase 3, and this file goes with it.
 */
describe("test harness", () => {
  it("renders the page and exposes jest-dom matchers", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /to get started/i }),
    ).toBeInTheDocument();
  });
});
