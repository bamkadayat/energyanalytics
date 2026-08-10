import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ViewCard } from "./view-card";

function renderCard() {
  return render(
    <ViewCard
      title="Price by hour and day"
      paramKey="heatmap"
      initialMode="chart"
      chart={<p>the chart</p>}
      table={<p>the table</p>}
    />,
  );
}

const card = () => document.querySelector("section") as HTMLElement;
const fullScreen = () => screen.getByRole("button", { name: /full screen/i });

describe("ViewCard full screen", () => {
  it("fills the window and reports its state", async () => {
    const user = userEvent.setup();
    renderCard();

    expect(fullScreen()).toHaveAttribute("aria-pressed", "false");
    expect(card().className).not.toContain("fixed");

    await user.click(fullScreen());

    expect(card().className).toContain("fixed inset-0");
    expect(screen.getByRole("button", { name: /exit full screen/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("locks the page behind it, and releases it on the way out", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(fullScreen());
    // Otherwise a wheel over the expanded card scrolls the dashboard underneath it.
    expect(document.documentElement.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: /exit full screen/i }));
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(fullScreen());
    await user.keyboard("{Escape}");

    expect(card().className).not.toContain("fixed");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("keeps the chart/table toggle working while expanded", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(fullScreen());
    await user.click(screen.getByRole("button", { name: /show .* as a table/i }));

    expect(screen.getByText("the table")).toBeInTheDocument();
    expect(card().className).toContain("fixed inset-0");
  });
});
