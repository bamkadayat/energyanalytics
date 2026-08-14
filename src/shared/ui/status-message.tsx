import type { ReactNode } from "react";

export type StatusTone = "info" | "success" | "warning" | "error" | "neutral";

export interface StatusMessageProps {
  tone: StatusTone;
  /** Short statement of what happened. Carries the meaning on its own. */
  title: string;
  /** Optional detail: what it means, what to do next. */
  children?: ReactNode;
  /** Retry control or link, where retrying can actually help. */
  action?: ReactNode;
  /** Announce when this appears after first render. Off by default — always-on is noise. */
  live?: boolean;
}

/*
 * Written out in full, never `bg-${tone}-surface`: Tailwind scans for complete class
 * names, so an interpolated one emits no CSS and fails silently.
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  info: "bg-info-surface border-info-line text-info-fg",
  success: "bg-success-surface border-success-line text-success-fg",
  warning: "bg-warning-surface border-warning-line text-warning-fg",
  error: "bg-error-surface border-error-line text-error-fg",
  neutral: "bg-surface-subtle border-line text-fg-secondary",
};

/**
 * Prefix read only by assistive technology. The visual channel conveys tone through
 * colour *and* icon shape; this gives the same information to a screen reader without
 * duplicating a word sighted users can already infer.
 */
const TONE_LABELS: Record<StatusTone, string> = {
  info: "Information:",
  success: "Success:",
  warning: "Warning:",
  error: "Error:",
  neutral: "Note:",
};

/**
 * The app's one status banner. Every tone carries colour, a distinct icon shape *and*
 * text, so none is load-bearing alone — hence a per-tone icon, not one generic dot.
 *
 * Domain-agnostic: mapping a state to a tone is the caller's job.
 */
export function StatusMessage({
  tone,
  title,
  children,
  action,
  live = false,
}: StatusMessageProps) {
  return (
    <div
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      className={`flex gap-3 rounded-card border p-4 ${TONE_CLASSES[tone]}`}
    >
      <ToneIcon tone={tone} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">
          <span className="sr-only">{TONE_LABELS[tone]} </span>
          {title}
        </p>
        {children ? <div className="text-sm">{children}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

/**
 * Distinct shape per tone, not a shared glyph tinted differently — the shape is one of
 * the three redundant signals. `aria-hidden` because the text already says it.
 */
function ToneIcon({ tone }: { tone: StatusTone }) {
  const shared = {
    className: "mt-0.5 h-5 w-5 shrink-0",
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: "false" as const,
  };

  switch (tone) {
    case "success":
      return (
        <svg {...shared}>
          <circle cx="10" cy="10" r="8" />
          <path d="M6.5 10.5l2.5 2.5 4.5-5" />
        </svg>
      );
    case "warning":
      return (
        <svg {...shared}>
          <path d="M10 2.5L18.5 17H1.5L10 2.5z" />
          <path d="M10 8v3.5" />
          <path d="M10 14.2v.1" />
        </svg>
      );
    case "error":
      return (
        <svg {...shared}>
          <circle cx="10" cy="10" r="8" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" />
        </svg>
      );
    case "neutral":
      return (
        <svg {...shared}>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 6.5v.1" />
          <path d="M10 9.5v4" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg {...shared}>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v4.5" />
          <path d="M10 6.4v.1" />
        </svg>
      );
  }
}
