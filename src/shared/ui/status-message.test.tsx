import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusMessage, type StatusTone } from "./status-message";

const ALL_TONES: StatusTone[] = ["info", "success", "warning", "error", "neutral"];

describe("StatusMessage", () => {
  it("renders the title and detail", () => {
    render(
      <StatusMessage tone="warning" title="Tomorrow's prices are not published yet">
        They are usually available from about 13:00.
      </StatusMessage>,
    );

    expect(
      screen.getByText(/tomorrow's prices are not published yet/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/usually available from about 13:00/i)).toBeInTheDocument();
  });

  it("conveys tone in text as well as colour", () => {
    // The core accessibility requirement: colour is never the only signal. A screen
    // reader hears the tone; a sighted user sees colour and a distinct icon shape.
    render(<StatusMessage tone="error" title="Could not load prices" />);

    expect(screen.getByText(/^Error:$/i)).toBeInTheDocument();
  });

  it("gives every tone its own label", () => {
    const labels = new Set<string>();

    for (const tone of ALL_TONES) {
      const { unmount } = render(<StatusMessage tone={tone} title="Message" />);
      const label = screen.getByText(/:$/).textContent ?? "";
      labels.add(label.trim());
      unmount();
    }

    expect(labels.size).toBe(ALL_TONES.length);
  });

  it("gives every tone a visually distinct icon", () => {
    // A shared glyph in a different colour would collapse two of the three signals
    // into one. Each tone's icon must differ in shape.
    const shapes = new Set<string>();

    for (const tone of ALL_TONES) {
      const { container, unmount } = render(<StatusMessage tone={tone} title="M" />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      shapes.add(svg?.innerHTML ?? "");
      unmount();
    }

    expect(shapes.size).toBe(ALL_TONES.length);
  });

  it("hides the icon from assistive technology, since the text already says it", () => {
    const { container } = render(<StatusMessage tone="info" title="Message" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies complete, non-interpolated tone classes", () => {
    // Tailwind scans for whole class names. An interpolated `bg-${tone}-surface` would
    // emit no CSS, and with the default palette cleared it would fail invisibly.
    const { container } = render(<StatusMessage tone="warning" title="Message" />);
    const banner = container.firstElementChild;

    expect(banner?.className).toContain("bg-warning-surface");
    expect(banner?.className).toContain("border-warning-line");
    expect(banner?.className).toContain("text-warning-fg");
  });

  it("uses design tokens rather than raw colour classes", () => {
    for (const tone of ALL_TONES) {
      const { container, unmount } = render(<StatusMessage tone={tone} title="M" />);
      const className = container.firstElementChild?.className ?? "";

      expect(className).not.toMatch(
        /\b(?:bg|text|border)-(?:slate|gray|zinc|red|amber|green|blue|white|black)\b/,
      );
      unmount();
    }
  });

  it("renders an action when retrying can help", () => {
    render(
      <StatusMessage
        tone="error"
        title="Could not reach the price service"
        action={<button type="button">Try again</button>}
      />,
    );

    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("is not a live region by default", () => {
    // A live region firing on every server render is noise rather than help.
    render(<StatusMessage tone="info" title="Message" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces politely when asked to", () => {
    render(<StatusMessage tone="warning" title="Showing partial data" live />);

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
  });
});
